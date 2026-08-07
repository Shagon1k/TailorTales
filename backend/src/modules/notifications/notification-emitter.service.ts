import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EMAIL_CLIENT, type IEmailClient, type ISendEmailInput } from '../email/email.types.js';
import { paymentFailedEmail } from '../email/templates/payment-failed.template.js';
import { storyCompletedEmail } from '../email/templates/story-completed.template.js';
import { storyFailedEmail } from '../email/templates/story-failed.template.js';
import { subscriptionCanceledEmail } from '../email/templates/subscription-canceled.template.js';
import { subscriptionRenewedEmail } from '../email/templates/subscription-renewed.template.js';
import { mergePreferences } from './notification-preferences.js';
import { NotificationsService } from './notifications.service.js';

export interface IStoryCompletedPayload {
    storyId: string;
    title: string;
    childName: string;
}

export interface IStoryFailedPayload {
    storyId: string;
    childName: string;
    question: string;
    error: string;
}

/**
 * Turns app events (generation pipeline, billing webhooks) into user
 * notifications. Each method: load user → check preferences → bell record
 * (via NotificationsService) → email.
 */
@Injectable()
export class NotificationEmitterService {
    private readonly logger = new Logger(NotificationEmitterService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly notifications: NotificationsService,
        @Inject(EMAIL_CLIENT) private readonly email: IEmailClient,
    ) {}

    async storyCompleted(userId: string, payload: IStoryCompletedPayload): Promise<void> {
        const user = await this.findUserOrWarn(userId);
        if (!user) return;
        const prefs = mergePreferences(user.notificationPreferences);

        if (prefs.storyCompleted.inApp) {
            await this.notifications.createBellRecord(userId, 'STORY_COMPLETED', { ...payload });
        }
        if (prefs.storyCompleted.email) {
            await this.sendEmailSafe(
                {
                    to: user.email,
                    ...storyCompletedEmail({
                        parentName: user.name,
                        childName: payload.childName,
                        storyTitle: payload.title,
                        storyUrl: `${this.frontendUrl()}/library/${payload.storyId}`,
                    }),
                },
                `story_completed for ${payload.storyId}`,
            );
        }
    }

    async storyFailed(userId: string, payload: IStoryFailedPayload): Promise<void> {
        const user = await this.findUserOrWarn(userId);
        if (!user) return;
        const prefs = mergePreferences(user.notificationPreferences);

        if (prefs.storyFailed.inApp) {
            await this.notifications.createBellRecord(userId, 'STORY_FAILED', { ...payload });
        }
        if (prefs.storyFailed.email) {
            await this.sendEmailSafe(
                {
                    to: user.email,
                    ...storyFailedEmail({
                        parentName: user.name,
                        childName: payload.childName,
                        question: payload.question,
                        workshopUrl: `${this.frontendUrl()}/workshop`,
                    }),
                },
                `story_failed for ${payload.storyId}`,
            );
        }
    }

    /** Payment failed (dunning started) — bell record + always-sent critical email. */
    async paymentFailed(userId: string): Promise<void> {
        const user = await this.findUserOrWarn(userId);
        if (!user) return;
        const prefs = mergePreferences(user.notificationPreferences);

        if (prefs.paymentFailed.inApp) {
            await this.notifications.createBellRecord(userId, 'PAYMENT_FAILED', {});
        }
        // No email toggle — billing-critical mail is always sent.

        await this.sendEmailSafe(
            {
                to: user.email,
                ...paymentFailedEmail({
                    parentName: user.name,
                    billingUrl: `${this.frontendUrl()}/account/subscription`,
                }),
            },
            `payment_failed for user ${userId}`,
        );
    }

    /** Subscription period ended after a scheduled cancel — bell record + email. */
    async subscriptionCanceled(userId: string): Promise<void> {
        const user = await this.findUserOrWarn(userId);
        if (!user) return;
        const prefs = mergePreferences(user.notificationPreferences);

        if (prefs.subscriptionCanceled.inApp) {
            await this.notifications.createBellRecord(userId, 'SUBSCRIPTION_CANCELED', {});
        }
        if (prefs.subscriptionCanceled.email) {
            await this.sendEmailSafe(
                {
                    to: user.email,
                    ...subscriptionCanceledEmail({
                        parentName: user.name,
                        pricingUrl: `${this.frontendUrl()}/pricing`,
                    }),
                },
                `subscription_canceled for user ${userId}`,
            );
        }
    }

    /** New billing cycle on the same tier — email only to avoid a routine bell notification. */
    async subscriptionRenewed(userId: string, tierName: string): Promise<void> {
        const user = await this.findUserOrWarn(userId);
        if (!user) return;
        const prefs = mergePreferences(user.notificationPreferences);

        if (prefs.subscriptionRenewed.email) {
            await this.sendEmailSafe(
                {
                    to: user.email,
                    ...subscriptionRenewedEmail({
                        parentName: user.name,
                        tierName,
                        billingUrl: `${this.frontendUrl()}/account/subscription`,
                    }),
                },
                `subscription_renewed for user ${userId}`,
            );
        }
    }

    private async findUserOrWarn(userId: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) this.logger.warn(`Skipping notification — user ${userId} not found`);
        return user;
    }

    /**
     * Email failure must never undo the operation that triggered it (generation
     * success, webhook handling) — log and continue.
     */
    private async sendEmailSafe(input: ISendEmailInput, context: string): Promise<void> {
        try {
            await this.email.send(input);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Failed to send ${context} email: ${message}`);
        }
    }

    private frontendUrl(): string {
        return this.config.getOrThrow<string>('FRONTEND_URL');
    }
}

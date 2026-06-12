import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PricingTiersService } from '../pricing-tiers/pricing-tiers.service.js';
import type { IPaddleEvent } from './billing.types.js';

/**
 * Maps Paddle webhook events onto Subscription rows. Every handler is
 * idempotent — Paddle retries deliveries and may send events out of order.
 * Unknown/unhandled events are logged and acknowledged (200) so Paddle
 * doesn't keep retrying them.
 */
@Injectable()
export class BillingWebhookService {
    private readonly logger = new Logger(BillingWebhookService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly pricingTiers: PricingTiersService,
    ) {}

    async handleEvent(event: IPaddleEvent): Promise<void> {
        switch (event.eventType) {
            case 'subscription.created':
            case 'subscription.activated':
                return this.handleActivated(event);
            case 'subscription.updated':
                return this.handleUpdated(event);
            case 'subscription.canceled':
                return this.handleCanceled(event);
            case 'subscription.past_due':
            case 'transaction.payment_failed':
                return this.handlePaymentTrouble(event);
            default:
                this.logger.log(`Ignoring Paddle event ${event.eventType}`);
        }
    }

    /** Checkout completed — attach the Paddle subscription to the user's row. */
    private async handleActivated(event: IPaddleEvent): Promise<void> {
        const userId = event.data.customData?.userId;
        if (!userId) {
            this.logger.error(
                `Paddle event ${event.eventType} (${event.data.id}) has no customData.userId — cannot match a user`,
            );
            return;
        }

        const tier = await this.resolveTier(event);
        if (!tier) return;

        await this.prisma.subscription.update({
            where: { userId },
            data: {
                pricingTierId: tier.id,
                paddleSubscriptionId: event.data.id,
                paddleCustomerId: event.data.customerId ?? null,
                status: 'ACTIVE',
                cancelAtPeriodEnd: false,
                currentPeriodEnd: this.parsePeriodEnd(event),
                pagesUsed: 0,
                regenerationsUsed: 0,
            },
        });

        this.logger.log(
            `Subscription ${event.data.id} activated for user ${userId} (${tier.name})`,
        );
    }

    /** Plan change, renewal, scheduled cancel, dunning recovery. */
    private async handleUpdated(event: IPaddleEvent): Promise<void> {
        const subscription = await this.prisma.subscription.findUnique({
            where: { paddleSubscriptionId: event.data.id },
        });
        if (!subscription) {
            this.logger.warn(
                `subscription.updated for unknown Paddle subscription ${event.data.id} — ignoring`,
            );
            return;
        }

        const tier = await this.resolveTier(event);
        if (!tier) return;

        const newPeriodEnd = this.parsePeriodEnd(event);
        // A later period end means a new billing cycle started → monthly reset.
        const isNewBillingCycle =
            newPeriodEnd !== null &&
            (subscription.currentPeriodEnd === null ||
                newPeriodEnd.getTime() > subscription.currentPeriodEnd.getTime());

        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                pricingTierId: tier.id,
                status: event.data.status === 'past_due' ? 'PAST_DUE' : 'ACTIVE',
                cancelAtPeriodEnd: event.data.scheduledChange?.action === 'cancel',
                currentPeriodEnd: newPeriodEnd,
                ...(isNewBillingCycle && { pagesUsed: 0, regenerationsUsed: 0 }),
            },
        });

        this.logger.log(
            `Subscription ${event.data.id} updated (tier ${tier.name}, newCycle=${isNewBillingCycle})`,
        );
    }

    /** Period ended after a scheduled cancel — revert to the free tier. */
    private async handleCanceled(event: IPaddleEvent): Promise<void> {
        const subscription = await this.prisma.subscription.findUnique({
            where: { paddleSubscriptionId: event.data.id },
        });
        if (!subscription) {
            this.logger.warn(
                `subscription.canceled for unknown Paddle subscription ${event.data.id} — ignoring (idempotent replay?)`,
            );
            return;
        }

        const freeTier = await this.pricingTiers.findFreeTier();

        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                pricingTierId: freeTier.id,
                paddleSubscriptionId: null,
                // paddleCustomerId is kept — invoice history stays reachable
                status: 'ACTIVE',
                cancelAtPeriodEnd: false,
                currentPeriodEnd: null,
                pagesUsed: 0,
                regenerationsUsed: 0,
            },
        });

        this.logger.log(`Subscription ${event.data.id} canceled — user reverted to free tier`);
    }

    /** Payment failed / dunning — keep tier access, flag the status (Phase 10 emails react to it). */
    private async handlePaymentTrouble(event: IPaddleEvent): Promise<void> {
        // subscription.past_due carries the subscription id as data.id;
        // transaction.payment_failed carries it as data.subscriptionId (data.id is the txn).
        const paddleSubscriptionId = event.data.subscriptionId ?? event.data.id;

        const result = await this.prisma.subscription.updateMany({
            where: { paddleSubscriptionId },
            data: { status: 'PAST_DUE' },
        });

        if (result.count === 0) {
            this.logger.warn(
                `${event.eventType} for unknown Paddle subscription ${paddleSubscriptionId} — ignoring`,
            );
            return;
        }
        this.logger.warn(
            `Subscription ${paddleSubscriptionId} marked PAST_DUE (${event.eventType})`,
        );
    }

    private async resolveTier(event: IPaddleEvent) {
        const priceId = event.data.items?.[0]?.price?.id;
        if (!priceId) {
            this.logger.error(`Paddle event ${event.eventType} (${event.data.id}) has no price id`);
            return null;
        }

        const tier = await this.pricingTiers.findByPaddlePriceId(priceId);
        if (!tier) {
            this.logger.error(
                `No PricingTier matches Paddle price ${priceId} — check seed/catalog ids`,
            );
            return null;
        }
        return tier;
    }

    private parsePeriodEnd(event: IPaddleEvent): Date | null {
        const endsAt = event.data.currentBillingPeriod?.endsAt;
        return endsAt ? new Date(endsAt) : null;
    }
}

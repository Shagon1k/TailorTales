import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EMAIL_CLIENT, type IEmailClient } from '../email/email.types.js';
import {
    storyCompletedHtml,
    storyCompletedSubject,
    storyCompletedText,
} from '../email/templates/story-completed.template.js';
import {
    storyFailedHtml,
    storyFailedSubject,
    storyFailedText,
} from '../email/templates/story-failed.template.js';

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

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        @Inject(EMAIL_CLIENT) private readonly email: IEmailClient,
    ) {}

    async storyCompleted(userId: string, payload: IStoryCompletedPayload): Promise<void> {
        await this.prisma.notification.create({
            data: { userId, type: 'STORY_COMPLETED', payload: { ...payload } },
        });

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            this.logger.warn(`Skipping email — user ${userId} not found`);
            return;
        }

        const storyUrl = `${this.frontendUrl()}/library/${payload.storyId}`;

        try {
            await this.email.send({
                to: user.email,
                subject: storyCompletedSubject(payload.childName),
                html: storyCompletedHtml({
                    parentName: user.name,
                    childName: payload.childName,
                    storyTitle: payload.title,
                    storyUrl,
                }),
                text: storyCompletedText({
                    parentName: user.name,
                    childName: payload.childName,
                    storyTitle: payload.title,
                    storyUrl,
                }),
            });
        } catch (err: unknown) {
            // Email failure must not undo a successful generation — log and continue.
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(
                `Failed to send story_completed email for ${payload.storyId}: ${message}`,
            );
        }
    }

    async storyFailed(userId: string, payload: IStoryFailedPayload): Promise<void> {
        await this.prisma.notification.create({
            data: { userId, type: 'STORY_FAILED', payload: { ...payload } },
        });

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;

        const workshopUrl = `${this.frontendUrl()}/workshop`;

        try {
            await this.email.send({
                to: user.email,
                subject: storyFailedSubject(),
                html: storyFailedHtml({
                    parentName: user.name,
                    childName: payload.childName,
                    question: payload.question,
                    workshopUrl,
                }),
                text: storyFailedText({
                    parentName: user.name,
                    childName: payload.childName,
                    question: payload.question,
                    workshopUrl,
                }),
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(
                `Failed to send story_failed email for ${payload.storyId}: ${message}`,
            );
        }
    }

    private frontendUrl(): string {
        return this.config.getOrThrow<string>('FRONTEND_URL');
    }
}

import { Injectable, Logger, type MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { Notification, NotificationType, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';
import { type INotificationPreferences, mergePreferences } from './notification-preferences.js';
import { NOTIFICATIONS_LIST_LIMIT } from './notifications.constants.js';

/**
 * The user's notification inbox: bell records, unread count (REST + SSE)
 * and channel preferences. Creating records on app events is the job of
 * `NotificationEmitterService`.
 */
@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    /**
     * One Subject per user with at least one open SSE connection. Created on
     * first subscribe, dropped when the last connection closes. In-memory by
     * design — a missed push only delays the bell until the next page load.
     */
    private readonly unreadStreams = new Map<string, Subject<number>>();

    constructor(private readonly prisma: PrismaService) {}

    async list(userId: string): Promise<Notification[]> {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: NOTIFICATIONS_LIST_LIMIT,
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { userId, readAt: null },
        });
    }

    async markRead(userId: string, id: string): Promise<void> {
        const result = await this.prisma.notification.updateMany({
            where: { id, userId },
            data: { readAt: new Date() },
        });
        if (result.count === 0) {
            throw new NotFoundException(`Notification ${id} not found`);
        }
        await this.pushUnreadCount(userId);
    }

    async markAllRead(userId: string): Promise<void> {
        await this.prisma.notification.updateMany({
            where: { userId, readAt: null },
            data: { readAt: new Date() },
        });
        await this.pushUnreadCount(userId);
    }

    async createBellRecord(
        userId: string,
        type: NotificationType,
        payload: Prisma.InputJsonValue,
    ): Promise<void> {
        await this.prisma.notification.create({ data: { userId, type, payload } });
        await this.pushUnreadCount(userId);
    }

    /** SSE source for the bell: emits the current unread count, then every change. */
    streamUnreadCount(userId: string): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            let subject = this.unreadStreams.get(userId);
            if (!subject) {
                subject = new Subject<number>();
                this.unreadStreams.set(userId, subject);
            }

            const subscription = subject.subscribe((count) =>
                subscriber.next({ data: { type: 'unread-count', count } }),
            );

            // Initial snapshot so the bell is correct before the first push.
            this.getUnreadCount(userId)
                .then((count) => subscriber.next({ data: { type: 'unread-count', count } }))
                .catch((err: unknown) => {
                    this.logger.error(`Initial unread count failed for user ${userId}`, err);
                });

            return () => {
                subscription.unsubscribe();
                if (!subject.observed) this.unreadStreams.delete(userId);
            };
        });
    }

    /** Stored partial merged over defaults — always returns the full toggle set. */
    async getPreferences(userId: string): Promise<INotificationPreferences> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true },
        });
        if (!user) throw new NotFoundException(`User ${userId} not found`);
        return mergePreferences(user.notificationPreferences);
    }

    /** Applies the partial patch and stores the full resulting toggle set. */
    async updatePreferences(
        userId: string,
        dto: UpdateNotificationPreferencesDto,
    ): Promise<INotificationPreferences> {
        const current = await this.getPreferences(userId);
        const next: INotificationPreferences = {
            storyCompleted: {
                email: dto.storyCompleted?.email ?? current.storyCompleted.email,
                inApp: dto.storyCompleted?.inApp ?? current.storyCompleted.inApp,
            },
            storyFailed: {
                email: dto.storyFailed?.email ?? current.storyFailed.email,
                inApp: dto.storyFailed?.inApp ?? current.storyFailed.inApp,
            },
            paymentFailed: {
                inApp: dto.paymentFailed?.inApp ?? current.paymentFailed.inApp,
            },
            subscriptionCanceled: {
                email: dto.subscriptionCanceled?.email ?? current.subscriptionCanceled.email,
                inApp: dto.subscriptionCanceled?.inApp ?? current.subscriptionCanceled.inApp,
            },
            subscriptionRenewed: {
                email: dto.subscriptionRenewed?.email ?? current.subscriptionRenewed.email,
            },
        };

        await this.prisma.user.update({
            where: { id: userId },
            // Spread — the interface type itself is not assignable to Prisma's InputJsonValue.
            data: { notificationPreferences: { ...next } },
        });
        return next;
    }

    /** Recomputes the unread count and pushes it to the user's open SSE connections. */
    private async pushUnreadCount(userId: string): Promise<void> {
        const subject = this.unreadStreams.get(userId);
        if (!subject) return;
        try {
            subject.next(await this.getUnreadCount(userId));
        } catch (err: unknown) {
            // A failed push must not fail the operation that triggered it.
            this.logger.error(`Unread count push failed for user ${userId}`, err);
        }
    }
}

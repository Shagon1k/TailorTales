import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const USER_ID = 'user-1';

function buildPrismaMock() {
    return {
        notification: {
            create: vi.fn().mockResolvedValue({}),
            findMany: vi.fn().mockResolvedValue([]),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            count: vi.fn().mockResolvedValue(0),
        },
        user: {
            findUnique: vi.fn().mockResolvedValue({ id: USER_ID, notificationPreferences: null }),
            update: vi.fn().mockResolvedValue({}),
        },
    };
}

describe('NotificationsService', () => {
    let service: NotificationsService;
    let prisma: ReturnType<typeof buildPrismaMock>;

    beforeEach(async () => {
        prisma = buildPrismaMock();
        const module = await Test.createTestingModule({
            providers: [NotificationsService, { provide: PrismaService, useValue: prisma }],
        }).compile();
        service = module.get(NotificationsService);
    });

    describe('list', () => {
        it('should return the latest 20 notifications, newest first', async () => {
            await service.list(USER_ID);

            expect(prisma.notification.findMany).toHaveBeenCalledWith({
                where: { userId: USER_ID },
                orderBy: { createdAt: 'desc' },
                take: 20,
            });
        });
    });

    describe('markRead', () => {
        it('should set readAt on the user-owned notification', async () => {
            await service.markRead(USER_ID, 'notif-1');

            expect(prisma.notification.updateMany).toHaveBeenCalledWith({
                where: { id: 'notif-1', userId: USER_ID },
                data: { readAt: expect.any(Date) },
            });
        });

        it('should throw NotFoundException when the notification is missing or not owned', async () => {
            prisma.notification.updateMany.mockResolvedValue({ count: 0 });

            await expect(service.markRead(USER_ID, 'notif-x')).rejects.toThrow(NotFoundException);
        });
    });

    describe('createBellRecord', () => {
        it('should create the record with the given type and payload', async () => {
            await service.createBellRecord(USER_ID, 'STORY_COMPLETED', { storyId: 'story-1' });

            expect(prisma.notification.create).toHaveBeenCalledWith({
                data: {
                    userId: USER_ID,
                    type: 'STORY_COMPLETED',
                    payload: { storyId: 'story-1' },
                },
            });
        });
    });

    describe('streamUnreadCount', () => {
        it('should emit the current count on connect and push again on changes', async () => {
            prisma.notification.count.mockResolvedValue(3);
            const events: unknown[] = [];

            const subscription = service
                .streamUnreadCount(USER_ID)
                .subscribe((event) => events.push(event.data));
            await vi.waitFor(() => expect(events).toHaveLength(1));
            expect(events[0]).toEqual({ type: 'unread-count', count: 3 });

            prisma.notification.count.mockResolvedValue(0);
            await service.markAllRead(USER_ID);

            expect(events[1]).toEqual({ type: 'unread-count', count: 0 });
            subscription.unsubscribe();
        });

        it('should not push to other users’ streams', async () => {
            const events: unknown[] = [];
            const subscription = service
                .streamUnreadCount('other-user')
                .subscribe((event) => events.push(event.data));
            await vi.waitFor(() => expect(events).toHaveLength(1));

            await service.markAllRead(USER_ID);

            expect(events).toHaveLength(1);
            subscription.unsubscribe();
        });

        it('should push the new count after createBellRecord', async () => {
            const events: unknown[] = [];
            const subscription = service
                .streamUnreadCount(USER_ID)
                .subscribe((event) => events.push(event.data));
            await vi.waitFor(() => expect(events).toHaveLength(1));

            prisma.notification.count.mockResolvedValue(1);
            await service.createBellRecord(USER_ID, 'STORY_COMPLETED', {});

            expect(events[1]).toEqual({ type: 'unread-count', count: 1 });
            subscription.unsubscribe();
        });
    });

    describe('getPreferences', () => {
        it('should return all toggles on when nothing is stored', async () => {
            const prefs = await service.getPreferences(USER_ID);

            expect(prefs).toEqual({
                storyCompleted: { email: true, inApp: true },
                storyFailed: { email: true, inApp: true },
                paymentFailed: { inApp: true },
                subscriptionCanceled: { email: true, inApp: true },
                subscriptionRenewed: { email: true },
            });
        });

        it('should throw NotFoundException for an unknown user', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.getPreferences(USER_ID)).rejects.toThrow(NotFoundException);
        });
    });

    describe('updatePreferences', () => {
        it('should apply the patch over current preferences and persist the full set', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: USER_ID,
                notificationPreferences: { storyFailed: { email: false } },
            });

            const prefs = await service.updatePreferences(USER_ID, {
                storyCompleted: { inApp: false },
            });

            // Patched toggle off, previously stored toggle preserved, rest defaulted.
            expect(prefs.storyCompleted).toEqual({ email: true, inApp: false });
            expect(prefs.storyFailed).toEqual({ email: false, inApp: true });
            expect(prefs.paymentFailed).toEqual({ inApp: true });

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: USER_ID },
                data: { notificationPreferences: prefs },
            });
        });
    });
});

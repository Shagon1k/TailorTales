import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationEmitterService } from '../notification-emitter.service.js';
import { NotificationsService } from '../notifications.service.js';
import { EMAIL_CLIENT } from '../../email/email.types.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const USER_ID = 'user-1';

function buildMockUser(notificationPreferences: unknown = null) {
    return { id: USER_ID, email: 'parent@example.com', name: 'Hannah', notificationPreferences };
}

function buildMocks() {
    return {
        prisma: {
            user: { findUnique: vi.fn().mockResolvedValue(buildMockUser()) },
        },
        notifications: {
            createBellRecord: vi.fn().mockResolvedValue(undefined),
        },
        email: {
            send: vi.fn().mockResolvedValue({ id: 'email-1' }),
        },
        config: {
            getOrThrow: vi.fn().mockReturnValue('https://app.test'),
        },
    };
}

describe('NotificationEmitterService', () => {
    let service: NotificationEmitterService;
    let mocks: ReturnType<typeof buildMocks>;

    beforeEach(async () => {
        mocks = buildMocks();
        const module = await Test.createTestingModule({
            providers: [
                NotificationEmitterService,
                { provide: PrismaService, useValue: mocks.prisma },
                { provide: NotificationsService, useValue: mocks.notifications },
                { provide: ConfigService, useValue: mocks.config },
                { provide: EMAIL_CLIENT, useValue: mocks.email },
            ],
        }).compile();
        service = module.get(NotificationEmitterService);
    });

    describe('storyCompleted', () => {
        it('should create a bell record and send an email', async () => {
            await service.storyCompleted(USER_ID, {
                storyId: 'story-1',
                title: 'Why Mountains Breathe Smoke',
                childName: 'Maya',
            });

            expect(mocks.notifications.createBellRecord).toHaveBeenCalledWith(
                USER_ID,
                'STORY_COMPLETED',
                expect.objectContaining({ storyId: 'story-1' }),
            );
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'parent@example.com',
                    subject: expect.stringContaining('Maya'),
                    html: expect.stringContaining('Why Mountains Breathe Smoke'),
                }),
            );
        });

        it('should swallow email errors so generation success is preserved', async () => {
            mocks.email.send.mockRejectedValue(new Error('Resend down'));

            await expect(
                service.storyCompleted(USER_ID, {
                    storyId: 'story-1',
                    title: 'X',
                    childName: 'Y',
                }),
            ).resolves.toBeUndefined();

            // Bell record must still have been created
            expect(mocks.notifications.createBellRecord).toHaveBeenCalled();
        });

        it('should skip the email but keep the bell record when the email toggle is off', async () => {
            mocks.prisma.user.findUnique.mockResolvedValue(
                buildMockUser({ storyCompleted: { email: false } }),
            );

            await service.storyCompleted(USER_ID, {
                storyId: 'story-1',
                title: 'X',
                childName: 'Y',
            });

            expect(mocks.notifications.createBellRecord).toHaveBeenCalled();
            expect(mocks.email.send).not.toHaveBeenCalled();
        });

        it('should skip the bell record but keep the email when the in-app toggle is off', async () => {
            mocks.prisma.user.findUnique.mockResolvedValue(
                buildMockUser({ storyCompleted: { inApp: false } }),
            );

            await service.storyCompleted(USER_ID, {
                storyId: 'story-1',
                title: 'X',
                childName: 'Y',
            });

            expect(mocks.notifications.createBellRecord).not.toHaveBeenCalled();
            expect(mocks.email.send).toHaveBeenCalled();
        });

        it('should do nothing when the user no longer exists', async () => {
            mocks.prisma.user.findUnique.mockResolvedValue(null);

            await service.storyCompleted(USER_ID, {
                storyId: 'story-1',
                title: 'X',
                childName: 'Y',
            });

            expect(mocks.notifications.createBellRecord).not.toHaveBeenCalled();
            expect(mocks.email.send).not.toHaveBeenCalled();
        });
    });

    describe('storyFailed', () => {
        it('should create a bell record and send an email with workshop link', async () => {
            await service.storyFailed(USER_ID, {
                storyId: 'story-2',
                childName: 'Maya',
                question: 'Why is the sky blue?',
                error: 'Moderation failed',
            });

            expect(mocks.notifications.createBellRecord).toHaveBeenCalledWith(
                USER_ID,
                'STORY_FAILED',
                expect.objectContaining({ storyId: 'story-2' }),
            );
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'parent@example.com',
                    html: expect.stringContaining('https://app.test/workshop'),
                }),
            );
        });
    });

    describe('paymentFailed', () => {
        it('should create a bell record and send an email', async () => {
            await service.paymentFailed(USER_ID);

            expect(mocks.notifications.createBellRecord).toHaveBeenCalledWith(
                USER_ID,
                'PAYMENT_FAILED',
                {},
            );
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('https://app.test/account/subscription'),
                }),
            );
        });

        it('should always send the email — it is billing-critical and has no toggle', async () => {
            // Even a stored (malformed) email:false must not suppress it.
            mocks.prisma.user.findUnique.mockResolvedValue(
                buildMockUser({ paymentFailed: { email: false, inApp: false } }),
            );

            await service.paymentFailed(USER_ID);

            expect(mocks.notifications.createBellRecord).not.toHaveBeenCalled();
            expect(mocks.email.send).toHaveBeenCalled();
        });
    });

    describe('subscriptionCanceled', () => {
        it('should create a bell record and send an email', async () => {
            await service.subscriptionCanceled(USER_ID);

            expect(mocks.notifications.createBellRecord).toHaveBeenCalledWith(
                USER_ID,
                'SUBSCRIPTION_CANCELED',
                {},
            );
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    html: expect.stringContaining('https://app.test/pricing'),
                }),
            );
        });
    });

    describe('subscriptionRenewed', () => {
        it('should send an email only — no bell record', async () => {
            await service.subscriptionRenewed(USER_ID, 'Story Hour');

            expect(mocks.notifications.createBellRecord).not.toHaveBeenCalled();
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({ subject: expect.stringContaining('Story Hour') }),
            );
        });

        it('should send nothing when the email toggle is off', async () => {
            mocks.prisma.user.findUnique.mockResolvedValue(
                buildMockUser({ subscriptionRenewed: { email: false } }),
            );

            await service.subscriptionRenewed(USER_ID, 'Story Hour');

            expect(mocks.email.send).not.toHaveBeenCalled();
        });
    });
});

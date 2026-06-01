import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from '../notifications.service.js';
import { EMAIL_CLIENT } from '../../email/email.types.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const USER_ID = 'user-1';
const mockUser = { id: USER_ID, email: 'parent@example.com', name: 'Hannah' };

function buildMocks() {
    return {
        prisma: {
            notification: { create: vi.fn().mockResolvedValue({}) },
            user: { findUnique: vi.fn().mockResolvedValue(mockUser) },
        },
        email: {
            send: vi.fn().mockResolvedValue({ id: 'email-1' }),
        },
        config: {
            getOrThrow: vi.fn().mockReturnValue('https://app.test'),
        },
    };
}

describe('NotificationsService', () => {
    let service: NotificationsService;
    let mocks: ReturnType<typeof buildMocks>;

    beforeEach(async () => {
        mocks = buildMocks();
        const module = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: PrismaService, useValue: mocks.prisma },
                { provide: ConfigService, useValue: mocks.config },
                { provide: EMAIL_CLIENT, useValue: mocks.email },
            ],
        }).compile();
        service = module.get(NotificationsService);
    });

    describe('storyCompleted', () => {
        it('should create a Notification row and send an email', async () => {
            await service.storyCompleted(USER_ID, {
                storyId: 'story-1',
                title: 'Why Mountains Breathe Smoke',
                childName: 'Maya',
            });

            expect(mocks.prisma.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ userId: USER_ID, type: 'STORY_COMPLETED' }),
            });
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
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
            expect(mocks.prisma.notification.create).toHaveBeenCalled();
        });
    });

    describe('storyFailed', () => {
        it('should create a Notification row and send an email with workshop link', async () => {
            await service.storyFailed(USER_ID, {
                storyId: 'story-2',
                childName: 'Maya',
                question: 'Why is the sky blue?',
                error: 'Moderation failed',
            });

            expect(mocks.prisma.notification.create).toHaveBeenCalledWith({
                data: expect.objectContaining({ userId: USER_ID, type: 'STORY_FAILED' }),
            });
            expect(mocks.email.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: mockUser.email,
                    html: expect.stringContaining('https://app.test/workshop'),
                }),
            );
        });
    });
});

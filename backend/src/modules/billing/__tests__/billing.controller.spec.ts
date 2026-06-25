import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { PricingTiersService } from '../../pricing-tiers/pricing-tiers.service.js';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service.js';
import { BillingController } from '../billing.controller.js';
import { PADDLE_CLIENT, type IPaddleSubscriptionSnapshot } from '../billing.types.js';

const TEST_USER = {
    id: 'user-1',
    email: 'ada@example.com',
    googleId: 'google-1',
    name: 'Ada',
    avatarUrl: null,
    role: 'USER',
    suspendedAt: null,
    notificationPreferences: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
} satisfies User;

const LOCAL_SUBSCRIPTION = {
    id: 'sub-row-1',
    userId: TEST_USER.id,
    paddleCustomerId: 'ctm_existing',
};

const STORY_HOUR = {
    id: 'tier-story-hour',
    name: 'Story Hour',
    paddlePriceId: 'pri_story_hour',
};

function paddleSubscription(
    overrides: Partial<IPaddleSubscriptionSnapshot> = {},
): IPaddleSubscriptionSnapshot {
    return {
        id: 'sub_1',
        customerId: 'ctm_existing',
        status: 'active',
        createdAt: '2026-06-25T14:30:00.000Z',
        customData: { userId: TEST_USER.id },
        items: [{ price: { id: STORY_HOUR.paddlePriceId } }],
        currentBillingPeriod: {
            startsAt: '2026-06-25T14:30:00.000Z',
            endsAt: '2026-07-25T14:30:00.000Z',
        },
        scheduledChange: null,
        ...overrides,
    };
}

describe('BillingController', () => {
    let controller: BillingController;
    let getOrCreateForUser: ReturnType<typeof vi.fn>;
    let applyPaddleSubscription: ReturnType<typeof vi.fn>;
    let findByPaddlePriceId: ReturnType<typeof vi.fn>;
    let findCustomersByEmail: ReturnType<typeof vi.fn>;
    let listSubscriptions: ReturnType<typeof vi.fn>;
    let cancelSubscription: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        getOrCreateForUser = vi.fn().mockResolvedValue(LOCAL_SUBSCRIPTION);
        applyPaddleSubscription = vi.fn().mockResolvedValue(undefined);
        findByPaddlePriceId = vi.fn().mockResolvedValue(STORY_HOUR);
        findCustomersByEmail = vi.fn().mockResolvedValue([{ id: 'ctm_from_email' }]);
        listSubscriptions = vi.fn().mockResolvedValue([]);
        cancelSubscription = vi.fn().mockResolvedValue(undefined);

        const module = await Test.createTestingModule({
            controllers: [BillingController],
            providers: [
                {
                    provide: PADDLE_CLIENT,
                    useValue: {
                        findCustomersByEmail,
                        listSubscriptions,
                        cancelSubscription,
                    },
                },
                {
                    provide: SubscriptionsService,
                    useValue: {
                        getOrCreateForUser,
                        applyPaddleSubscription,
                    },
                },
                {
                    provide: PricingTiersService,
                    useValue: { findByPaddlePriceId },
                },
            ],
        }).compile();

        controller = module.get(BillingController);
    });

    describe('syncSubscription', () => {
        it('should apply the newest active Paddle subscription owned by the user', async () => {
            listSubscriptions.mockImplementation((customerId: string) =>
                Promise.resolve(
                    customerId === 'ctm_existing'
                        ? [
                              paddleSubscription({
                                  id: 'sub_old',
                                  currentBillingPeriod: {
                                      startsAt: '2026-06-20T10:00:00.000Z',
                                      endsAt: '2026-07-20T10:00:00.000Z',
                                  },
                              }),
                              paddleSubscription({
                                  id: 'sub_new',
                                  currentBillingPeriod: {
                                      startsAt: '2026-06-25T10:00:00.000Z',
                                      endsAt: '2026-07-25T10:00:00.000Z',
                                  },
                              }),
                          ]
                        : [],
                ),
            );

            const result = await controller.syncSubscription(TEST_USER);

            expect(result).toEqual({ synced: true });
            expect(findCustomersByEmail).toHaveBeenCalledWith(TEST_USER.email);
            expect(listSubscriptions).toHaveBeenCalledWith('ctm_existing');
            expect(listSubscriptions).toHaveBeenCalledWith('ctm_from_email');
            expect(applyPaddleSubscription).toHaveBeenCalledWith(TEST_USER.id, {
                pricingTierId: STORY_HOUR.id,
                paddleSubscriptionId: 'sub_new',
                paddleCustomerId: 'ctm_existing',
                status: 'ACTIVE',
                cancelAtPeriodEnd: false,
                currentPeriodEnd: new Date('2026-07-25T10:00:00.000Z'),
            });
            expect(cancelSubscription).toHaveBeenCalledWith('sub_old');
            expect(cancelSubscription).not.toHaveBeenCalledWith('sub_new');
        });

        it('should ignore Paddle subscriptions that belong to another user', async () => {
            listSubscriptions.mockResolvedValue([
                paddleSubscription({ customData: { userId: 'other-user' } }),
            ]);

            const result = await controller.syncSubscription(TEST_USER);

            expect(result).toEqual({ synced: false });
            expect(applyPaddleSubscription).not.toHaveBeenCalled();
            expect(cancelSubscription).not.toHaveBeenCalled();
        });

        it('should not cancel overlapping subscriptions that are already scheduled to cancel', async () => {
            listSubscriptions.mockResolvedValue([
                paddleSubscription({ id: 'sub_current' }),
                paddleSubscription({
                    id: 'sub_canceling',
                    scheduledChange: { action: 'cancel' },
                    currentBillingPeriod: {
                        startsAt: '2026-06-20T10:00:00.000Z',
                        endsAt: '2026-07-20T10:00:00.000Z',
                    },
                }),
            ]);

            const result = await controller.syncSubscription(TEST_USER);

            expect(result).toEqual({ synced: true });
            expect(cancelSubscription).not.toHaveBeenCalled();
        });
    });
});

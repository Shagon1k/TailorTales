import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { PricingTiersService } from '../../pricing-tiers/pricing-tiers.service.js';
import { BillingWebhookService } from '../billing-webhook.service.js';
import type { IPaddleEvent } from '../billing.types.js';

const FREE_TIER = { id: 'tier-free', name: 'Free Chapter', paddlePriceId: null };
const STORY_HOUR = { id: 'tier-story-hour', name: 'Story Hour', paddlePriceId: 'pri_story_hour' };

const PERIOD_END_JUNE = new Date('2026-06-30T10:00:00.000Z');
const PERIOD_END_JULY = new Date('2026-07-30T10:00:00.000Z');

function activatedEvent(overrides: Partial<IPaddleEvent['data']> = {}): IPaddleEvent {
    return {
        eventType: 'subscription.activated',
        data: {
            id: 'sub_1',
            customerId: 'ctm_1',
            status: 'active',
            customData: { userId: 'user-1' },
            items: [{ price: { id: 'pri_story_hour' } }],
            currentBillingPeriod: { endsAt: PERIOD_END_JUNE.toISOString() },
            scheduledChange: null,
            ...overrides,
        },
    };
}

function existingSubscription(overrides: Record<string, unknown> = {}) {
    return {
        id: 'sub-row-1',
        userId: 'user-1',
        pricingTierId: STORY_HOUR.id,
        paddleSubscriptionId: 'sub_1',
        paddleCustomerId: 'ctm_1',
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: PERIOD_END_JUNE,
        pagesUsed: 30,
        regenerationsUsed: 5,
        ...overrides,
    };
}

describe('BillingWebhookService', () => {
    let service: BillingWebhookService;
    let subscriptionUpdate: ReturnType<typeof vi.fn>;
    let subscriptionUpdateMany: ReturnType<typeof vi.fn>;
    let subscriptionFindUnique: ReturnType<typeof vi.fn>;
    let findByPaddlePriceId: ReturnType<typeof vi.fn>;
    let findFreeTier: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        subscriptionUpdate = vi.fn().mockResolvedValue({});
        subscriptionUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
        subscriptionFindUnique = vi.fn();
        findByPaddlePriceId = vi.fn().mockResolvedValue(STORY_HOUR);
        findFreeTier = vi.fn().mockResolvedValue(FREE_TIER);

        const module = await Test.createTestingModule({
            providers: [
                BillingWebhookService,
                {
                    provide: PrismaService,
                    useValue: {
                        subscription: {
                            update: subscriptionUpdate,
                            updateMany: subscriptionUpdateMany,
                            findUnique: subscriptionFindUnique,
                        },
                    },
                },
                {
                    provide: PricingTiersService,
                    useValue: { findByPaddlePriceId, findFreeTier },
                },
            ],
        }).compile();

        service = module.get(BillingWebhookService);
    });

    describe('subscription.activated', () => {
        it('should attach the Paddle subscription to the user matched via customData.userId', async () => {
            await service.handleEvent(activatedEvent());

            expect(subscriptionUpdate).toHaveBeenCalledWith({
                where: { userId: 'user-1' },
                data: {
                    pricingTierId: STORY_HOUR.id,
                    paddleSubscriptionId: 'sub_1',
                    paddleCustomerId: 'ctm_1',
                    status: 'ACTIVE',
                    cancelAtPeriodEnd: false,
                    currentPeriodEnd: PERIOD_END_JUNE,
                    pagesUsed: 0,
                    regenerationsUsed: 0,
                },
            });
        });

        it('should be idempotent — replaying the same event writes the same state', async () => {
            await service.handleEvent(activatedEvent());
            await service.handleEvent(activatedEvent());

            expect(subscriptionUpdate).toHaveBeenCalledTimes(2);
            expect(subscriptionUpdate.mock.calls[0][0]).toEqual(
                subscriptionUpdate.mock.calls[1][0],
            );
        });

        it('should ignore the event (without crashing) when customData.userId is missing', async () => {
            await service.handleEvent(activatedEvent({ customData: null }));

            expect(subscriptionUpdate).not.toHaveBeenCalled();
        });

        it('should ignore the event when the price id matches no PricingTier', async () => {
            findByPaddlePriceId.mockResolvedValue(null);

            await service.handleEvent(activatedEvent());

            expect(subscriptionUpdate).not.toHaveBeenCalled();
        });

        it('should treat subscription.created as an alias of activated', async () => {
            await service.handleEvent({ ...activatedEvent(), eventType: 'subscription.created' });

            expect(subscriptionUpdate).toHaveBeenCalled();
        });
    });

    describe('subscription.updated', () => {
        it('should reset usage counters when the billing period advanced (renewal)', async () => {
            subscriptionFindUnique.mockResolvedValue(existingSubscription());

            await service.handleEvent({
                ...activatedEvent({
                    currentBillingPeriod: { endsAt: PERIOD_END_JULY.toISOString() },
                }),
                eventType: 'subscription.updated',
            });

            expect(subscriptionUpdate).toHaveBeenCalledWith({
                where: { id: 'sub-row-1' },
                data: expect.objectContaining({
                    currentPeriodEnd: PERIOD_END_JULY,
                    pagesUsed: 0,
                    regenerationsUsed: 0,
                }),
            });
        });

        it('should NOT reset counters when the period is unchanged (mid-cycle plan change)', async () => {
            subscriptionFindUnique.mockResolvedValue(existingSubscription());

            await service.handleEvent({
                ...activatedEvent(),
                eventType: 'subscription.updated',
            });

            const data = subscriptionUpdate.mock.calls[0][0].data;
            expect(data.pagesUsed).toBeUndefined();
            expect(data.regenerationsUsed).toBeUndefined();
        });

        it('should set cancelAtPeriodEnd from a scheduled cancel change', async () => {
            subscriptionFindUnique.mockResolvedValue(existingSubscription());

            await service.handleEvent({
                ...activatedEvent({ scheduledChange: { action: 'cancel' } }),
                eventType: 'subscription.updated',
            });

            expect(subscriptionUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ cancelAtPeriodEnd: true }),
                }),
            );
        });

        it('should ignore updates for unknown Paddle subscriptions', async () => {
            subscriptionFindUnique.mockResolvedValue(null);

            await service.handleEvent({ ...activatedEvent(), eventType: 'subscription.updated' });

            expect(subscriptionUpdate).not.toHaveBeenCalled();
        });
    });

    describe('subscription.canceled', () => {
        it('should revert the user to the free tier, keeping paddleCustomerId', async () => {
            subscriptionFindUnique.mockResolvedValue(existingSubscription());

            await service.handleEvent({ ...activatedEvent(), eventType: 'subscription.canceled' });

            expect(subscriptionUpdate).toHaveBeenCalledWith({
                where: { id: 'sub-row-1' },
                data: {
                    pricingTierId: FREE_TIER.id,
                    paddleSubscriptionId: null,
                    status: 'ACTIVE',
                    cancelAtPeriodEnd: false,
                    currentPeriodEnd: null,
                    pagesUsed: 0,
                    regenerationsUsed: 0,
                },
            });
        });

        it('should ignore a canceled replay for an already-detached subscription', async () => {
            subscriptionFindUnique.mockResolvedValue(null);

            await service.handleEvent({ ...activatedEvent(), eventType: 'subscription.canceled' });

            expect(subscriptionUpdate).not.toHaveBeenCalled();
        });
    });

    describe('payment trouble events', () => {
        it('should mark the subscription PAST_DUE on subscription.past_due', async () => {
            await service.handleEvent({ ...activatedEvent(), eventType: 'subscription.past_due' });

            expect(subscriptionUpdateMany).toHaveBeenCalledWith({
                where: { paddleSubscriptionId: 'sub_1' },
                data: { status: 'PAST_DUE' },
            });
        });

        it('should resolve the subscription id from data.subscriptionId on transaction.payment_failed', async () => {
            await service.handleEvent({
                eventType: 'transaction.payment_failed',
                data: { id: 'txn_99', subscriptionId: 'sub_1' },
            });

            expect(subscriptionUpdateMany).toHaveBeenCalledWith({
                where: { paddleSubscriptionId: 'sub_1' },
                data: { status: 'PAST_DUE' },
            });
        });
    });

    describe('unknown events', () => {
        it('should log and ignore unhandled event types', async () => {
            await service.handleEvent({ eventType: 'address.updated', data: { id: 'add_1' } });

            expect(subscriptionUpdate).not.toHaveBeenCalled();
            expect(subscriptionUpdateMany).not.toHaveBeenCalled();
        });
    });
});

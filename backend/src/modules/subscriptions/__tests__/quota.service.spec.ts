import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { QuotaService } from '../quota.service.js';
import { SubscriptionsService } from '../subscriptions.service.js';
import type { TSubscriptionWithTier } from '../subscriptions.types.js';

const MOCK_FREE_TIER = {
    id: 'tier-free',
    name: 'Free Chapter',
    paddleProductId: null,
    paddlePriceId: null,
    priceMonthly: 0,
    pagesPerMonth: 12,
    regenerationsPerMonth: 3,
    childrenLimit: 1,
    retentionDays: 30,
    watermark: true,
    order: 1,
};

const MOCK_PAID_TIER = {
    ...MOCK_FREE_TIER,
    id: 'tier-story-hour',
    name: 'Story Hour',
    paddlePriceId: 'pri_123',
    priceMonthly: 500,
    pagesPerMonth: 60,
    regenerationsPerMonth: 10,
    childrenLimit: 3,
    retentionDays: null,
    watermark: false,
    order: 2,
};

function buildSubscription(overrides: Partial<TSubscriptionWithTier> = {}): TSubscriptionWithTier {
    return {
        id: 'sub-1',
        userId: 'user-1',
        pricingTierId: MOCK_FREE_TIER.id,
        pricingTier: MOCK_FREE_TIER,
        paddleSubscriptionId: null,
        paddleCustomerId: null,
        status: 'ACTIVE',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        pagesUsed: 0,
        regenerationsUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

describe('QuotaService', () => {
    let service: QuotaService;
    let getOrCreateForUser: ReturnType<typeof vi.fn>;
    let subscriptionUpdate: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        getOrCreateForUser = vi.fn();
        subscriptionUpdate = vi.fn();

        const module = await Test.createTestingModule({
            providers: [
                QuotaService,
                {
                    provide: SubscriptionsService,
                    useValue: { getOrCreateForUser },
                },
                {
                    provide: PrismaService,
                    useValue: { subscription: { update: subscriptionUpdate } },
                },
            ],
        }).compile();

        service = module.get(QuotaService);
    });

    describe('assertPageCredits', () => {
        it('should pass when the cost fits the remaining balance', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ pagesUsed: 4 }));

            await expect(service.assertPageCredits('user-1', 8, 'BOOK')).resolves.toBeUndefined();
        });

        it('should pass exactly at the limit boundary', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ pagesUsed: 0 }));

            await expect(service.assertPageCredits('user-1', 12, 'BOOK')).resolves.toBeUndefined();
        });

        it('should throw ForbiddenException when the cost exceeds the remaining balance', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ pagesUsed: 8 }));

            await expect(service.assertPageCredits('user-1', 5, 'BOOK')).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should include the error code and dynamic params in the exception body', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ pagesUsed: 8 }));

            const err = await service.assertPageCredits('user-1', 5, 'BOOK').catch((e) => e);
            expect(err).toBeInstanceOf(ForbiddenException);
            expect((err as ForbiddenException).getResponse()).toMatchObject({
                code: 'errors.quota.pageCreditsExceeded',
                params: { cost: 5, remaining: 4, limit: 12 },
            });
        });

        it('should charge comic pages at 2 credits per page', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ pagesUsed: 0 }));

            // 8 comic pages = 16 credits > 12-page free allowance
            await expect(service.assertPageCredits('user-1', 8, 'COMIC')).rejects.toThrow(
                ForbiddenException,
            );
        });
    });

    describe('deductPageCredits', () => {
        it('should increment pagesUsed by the credit cost', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription());

            await service.deductPageCredits('user-1', 5, 'COMIC');

            expect(subscriptionUpdate).toHaveBeenCalledWith({
                where: { id: 'sub-1' },
                data: { pagesUsed: { increment: 10 } },
            });
        });
    });

    describe('assertRegenerationCredit', () => {
        it('should pass while under the monthly limit', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ regenerationsUsed: 2 }));

            await expect(service.assertRegenerationCredit('user-1')).resolves.toBeUndefined();
        });

        it('should throw ForbiddenException at the monthly limit', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ regenerationsUsed: 3 }));

            await expect(service.assertRegenerationCredit('user-1')).rejects.toThrow(
                ForbiddenException,
            );
        });

        it('should include the error code and limit param in the exception body', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription({ regenerationsUsed: 3 }));

            const err = await service.assertRegenerationCredit('user-1').catch((e) => e);
            expect((err as ForbiddenException).getResponse()).toMatchObject({
                code: 'errors.quota.regenerationsExceeded',
                params: { limit: 3 },
            });
        });
    });

    describe('recordRegeneration', () => {
        it('should increment regenerationsUsed via the default client', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription());

            await service.recordRegeneration('user-1');

            expect(subscriptionUpdate).toHaveBeenCalledWith({
                where: { id: 'sub-1' },
                data: { regenerationsUsed: { increment: 1 } },
            });
        });

        it('should write through the provided transaction client when given', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription());
            const txUpdate = vi.fn();
            const tx = { subscription: { update: txUpdate } };

            // @ts-expect-error partial Prisma.TransactionClient mock — only the method under test
            await service.recordRegeneration('user-1', tx);

            expect(txUpdate).toHaveBeenCalled();
            expect(subscriptionUpdate).not.toHaveBeenCalled();
        });
    });

    describe('getWatermarkForUser', () => {
        it('should return true on the free tier', async () => {
            getOrCreateForUser.mockResolvedValue(buildSubscription());

            await expect(service.getWatermarkForUser('user-1')).resolves.toBe(true);
        });

        it('should return false on a paid tier', async () => {
            getOrCreateForUser.mockResolvedValue(
                buildSubscription({
                    pricingTierId: MOCK_PAID_TIER.id,
                    pricingTier: MOCK_PAID_TIER,
                }),
            );

            await expect(service.getWatermarkForUser('user-1')).resolves.toBe(false);
        });
    });
});

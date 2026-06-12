import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { PricingTiersService } from '../../pricing-tiers/pricing-tiers.service.js';
import { SubscriptionsService } from '../subscriptions.service.js';

const MOCK_FREE_TIER = {
    id: 'tier-free',
    name: 'Free Chapter',
    priceMonthly: 0,
    pagesPerMonth: 12,
    regenerationsPerMonth: 3,
    childrenLimit: 1,
    retentionDays: 30,
    watermark: true,
    order: 1,
    paddleProductId: null,
    paddlePriceId: null,
};

const MOCK_SUBSCRIPTION = {
    id: 'sub-1',
    userId: 'user-1',
    pricingTierId: MOCK_FREE_TIER.id,
    pricingTier: MOCK_FREE_TIER,
    paddleSubscriptionId: null,
    paddleCustomerId: null,
    status: 'ACTIVE',
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    pagesUsed: 5,
    regenerationsUsed: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('SubscriptionsService', () => {
    let service: SubscriptionsService;
    let subscriptionFindUnique: ReturnType<typeof vi.fn>;
    let subscriptionCreate: ReturnType<typeof vi.fn>;
    let childCount: ReturnType<typeof vi.fn>;
    let storyCount: ReturnType<typeof vi.fn>;
    let findFreeTier: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        subscriptionFindUnique = vi.fn();
        subscriptionCreate = vi.fn();
        childCount = vi.fn().mockResolvedValue(1);
        storyCount = vi.fn().mockResolvedValue(4);
        findFreeTier = vi.fn().mockResolvedValue(MOCK_FREE_TIER);

        const module = await Test.createTestingModule({
            providers: [
                SubscriptionsService,
                {
                    provide: PrismaService,
                    useValue: {
                        subscription: {
                            findUnique: subscriptionFindUnique,
                            create: subscriptionCreate,
                        },
                        child: { count: childCount },
                        story: { count: storyCount },
                    },
                },
                {
                    provide: PricingTiersService,
                    useValue: { findFreeTier },
                },
            ],
        }).compile();

        service = module.get(SubscriptionsService);
    });

    describe('getOrCreateForUser', () => {
        it('should return the existing subscription without creating one', async () => {
            subscriptionFindUnique.mockResolvedValue(MOCK_SUBSCRIPTION);

            const result = await service.getOrCreateForUser('user-1');

            expect(result).toBe(MOCK_SUBSCRIPTION);
            expect(subscriptionCreate).not.toHaveBeenCalled();
        });

        it('should lazily create a free-tier subscription when none exists', async () => {
            subscriptionFindUnique.mockResolvedValue(null);
            subscriptionCreate.mockResolvedValue(MOCK_SUBSCRIPTION);

            const result = await service.getOrCreateForUser('user-1');

            expect(subscriptionCreate).toHaveBeenCalledWith({
                data: { userId: 'user-1', pricingTierId: MOCK_FREE_TIER.id },
                include: { pricingTier: true },
            });
            expect(result).toBe(MOCK_SUBSCRIPTION);
        });
    });

    describe('getUsageSummary', () => {
        it('should combine subscription state with live children and tales counts', async () => {
            subscriptionFindUnique.mockResolvedValue(MOCK_SUBSCRIPTION);

            const summary = await service.getUsageSummary('user-1');

            expect(summary).toMatchObject({
                tier: { name: 'Free Chapter', pagesPerMonth: 12, watermark: true },
                status: 'ACTIVE',
                pagesUsed: 5,
                regenerationsUsed: 1,
                childrenUsed: 1,
                talesCount: 4,
            });
        });
    });
});

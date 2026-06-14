import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdminStatsService } from '../admin-stats.service.js';

function buildPrismaMock() {
    return {
        user: { count: vi.fn().mockResolvedValue(42) },
        story: { count: vi.fn().mockResolvedValue(100) },
        pricingTier: {
            findMany: vi.fn().mockResolvedValue([
                { id: 'free', priceMonthly: 0 },
                { id: 'plus', priceMonthly: 500 },
                { id: 'pro', priceMonthly: 1000 },
            ]),
        },
        subscription: {
            groupBy: vi.fn().mockResolvedValue([
                { pricingTierId: 'free', _count: { _all: 30 } },
                { pricingTierId: 'plus', _count: { _all: 10 } },
                { pricingTierId: 'pro', _count: { _all: 4 } },
            ]),
        },
        $transaction: vi.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
}

describe('AdminStatsService', () => {
    let service: AdminStatsService;
    let prisma: ReturnType<typeof buildPrismaMock>;

    beforeEach(async () => {
        prisma = buildPrismaMock();
        const module = await Test.createTestingModule({
            providers: [AdminStatsService, { provide: PrismaService, useValue: prisma }],
        }).compile();
        service = module.get(AdminStatsService);
    });

    describe('getStats', () => {
        it('should return user and story counts', async () => {
            const stats = await service.getStats();

            expect(stats.users).toBe(42);
            expect(stats.stories).toBe(100);
        });

        it('should compute MRR as the sum of active tier prices', async () => {
            // 10 × 500 + 4 × 1000 = 9000 (free tier adds nothing)
            const stats = await service.getStats();

            expect(stats.mrrCents).toBe(9000);
        });

        it('should count only paid subscriptions as active paid', async () => {
            const stats = await service.getStats();

            expect(stats.activePaidSubscriptions).toBe(14);
        });
    });
});

import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { FreeTierResetCron } from '../free-tier-reset.cron.js';

const FIXED_PERIOD_END = new Date('2026-05-15T00:00:00.000Z');
const EXPECTED_NEXT_PERIOD_END = new Date('2026-06-15T00:00:00.000Z');

describe('FreeTierResetCron', () => {
    let cron: FreeTierResetCron;
    let subscriptionFindMany: ReturnType<typeof vi.fn>;
    let subscriptionUpdate: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        subscriptionFindMany = vi.fn().mockResolvedValue([
            { id: 'sub-1', currentPeriodEnd: FIXED_PERIOD_END },
            { id: 'sub-2', currentPeriodEnd: FIXED_PERIOD_END },
        ]);
        subscriptionUpdate = vi.fn().mockResolvedValue({});

        const module = await Test.createTestingModule({
            providers: [
                FreeTierResetCron,
                {
                    provide: PrismaService,
                    useValue: {
                        subscription: {
                            findMany: subscriptionFindMany,
                            update: subscriptionUpdate,
                        },
                    },
                },
            ],
        }).compile();

        cron = module.get(FreeTierResetCron);
    });

    it('should query only free subscriptions whose period end has passed', async () => {
        await cron.resetFreeTierUsage();

        expect(subscriptionFindMany).toHaveBeenCalledWith({
            where: { paddleSubscriptionId: null, currentPeriodEnd: { lte: expect.any(Date) } },
            select: { id: true, currentPeriodEnd: true },
        });
    });

    it('should reset counters and advance currentPeriodEnd by one month for each due subscription', async () => {
        await cron.resetFreeTierUsage();

        expect(subscriptionUpdate).toHaveBeenCalledTimes(2);
        expect(subscriptionUpdate).toHaveBeenCalledWith({
            where: { id: 'sub-1' },
            data: {
                pagesUsed: 0,
                regenerationsUsed: 0,
                currentPeriodEnd: EXPECTED_NEXT_PERIOD_END,
            },
        });
    });

    it('should skip reset when no free subscriptions are due', async () => {
        subscriptionFindMany.mockResolvedValue([]);

        await cron.resetFreeTierUsage();

        expect(subscriptionUpdate).not.toHaveBeenCalled();
    });
});

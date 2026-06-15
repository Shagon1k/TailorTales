import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IAdminStats } from './admin.types.js';

@Injectable()
export class AdminStatsService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Dashboard top-line numbers. MRR is contracted, not billed — the sum of each ACTIVE
     * subscription's tier price. Free-tier subs (price 0) add nothing and are excluded from
     * the "active paid subscriptions" count.
     */
    async getStats(): Promise<IAdminStats> {
        const [users, stories, tiers, byTier] = await this.prisma.$transaction([
            this.prisma.user.count(),
            this.prisma.story.count(),
            this.prisma.pricingTier.findMany({ select: { id: true, priceMonthly: true } }),
            this.prisma.subscription.groupBy({
                by: ['pricingTierId'],
                where: { status: 'ACTIVE' },
                _count: { _all: true },
            }),
        ]);

        const priceByTier = new Map(tiers.map((tier) => [tier.id, tier.priceMonthly]));

        let mrrCents = 0;
        let activePaidSubscriptions = 0;
        for (const group of byTier) {
            const price = priceByTier.get(group.pricingTierId) ?? 0;
            const count = group._count._all;
            mrrCents += price * count;
            if (price > 0) {
                activePaidSubscriptions += count;
            }
        }

        return { users, stories, activePaidSubscriptions, mrrCents };
    }
}

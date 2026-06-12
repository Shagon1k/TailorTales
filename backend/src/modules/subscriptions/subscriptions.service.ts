import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PricingTiersService } from '../pricing-tiers/pricing-tiers.service.js';
import type { IUsageSummary, TSubscriptionWithTier } from './subscriptions.types.js';

@Injectable()
export class SubscriptionsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pricingTiers: PricingTiersService,
    ) {}

    /**
     * Every user is expected to own a Subscription row (created at signup /
     * backfilled by seed). The lazy upsert here is the safety net that keeps
     * the single quota code path from ever hitting a missing row.
     */
    async getOrCreateForUser(userId: string): Promise<TSubscriptionWithTier> {
        const existing = await this.prisma.subscription.findUnique({
            where: { userId },
            include: { pricingTier: true },
        });

        if (existing) {
            return existing;
        }

        const freeTier = await this.pricingTiers.findFreeTier();

        return this.prisma.subscription.create({
            data: { userId, pricingTierId: freeTier.id },
            include: { pricingTier: true },
        });
    }

    async getUsageSummary(userId: string): Promise<IUsageSummary> {
        const subscription = await this.getOrCreateForUser(userId);
        const [childrenUsed, talesCount] = await Promise.all([
            this.prisma.child.count({ where: { userId } }),
            this.prisma.story.count({ where: { userId } }),
        ]);

        const { pricingTier } = subscription;

        return {
            tier: {
                id: pricingTier.id,
                name: pricingTier.name,
                priceMonthly: pricingTier.priceMonthly,
                watermark: pricingTier.watermark,
                pagesPerMonth: pricingTier.pagesPerMonth,
                regenerationsPerMonth: pricingTier.regenerationsPerMonth,
                childrenLimit: pricingTier.childrenLimit,
                retentionDays: pricingTier.retentionDays,
            },
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            currentPeriodEnd: subscription.currentPeriodEnd,
            pagesUsed: subscription.pagesUsed,
            regenerationsUsed: subscription.regenerationsUsed,
            childrenUsed,
            talesCount,
        };
    }

    async markCancelScheduled(userId: string): Promise<void> {
        await this.prisma.subscription.update({
            where: { userId },
            data: { cancelAtPeriodEnd: true },
        });
    }
}

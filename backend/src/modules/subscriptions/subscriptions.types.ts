import type {
    PricingTier,
    Subscription,
    SubscriptionStatus,
} from '../../generated/prisma/client.js';

export type TSubscriptionWithTier = Subscription & { pricingTier: PricingTier };

/** Everything the frontend needs for usage bars, library stats, and the plan card. */
export interface IUsageSummary {
    tier: {
        id: string;
        name: string;
        priceMonthly: number;
        watermark: boolean;
        pagesPerMonth: number;
        regenerationsPerMonth: number;
        childrenLimit: number | null;
        retentionDays: number | null;
    };
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date | null;
    pagesUsed: number;
    regenerationsUsed: number;
    childrenUsed: number;
    talesCount: number;
}

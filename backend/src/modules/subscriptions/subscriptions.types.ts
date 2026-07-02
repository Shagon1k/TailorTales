import type {
    PricingTier,
    Subscription,
    SubscriptionStatus,
} from '../../generated/prisma/client.js';

export type TSubscriptionWithTier = Subscription & {
    characterGenerationsUsed: number;
    pricingTier: PricingTier & {
        characterGenerationsPerMonth: number;
        charactersLimit: number | null;
    };
};

/** Everything the frontend needs for usage bars, library stats, and the plan card. */
export interface IUsageSummary {
    tier: {
        id: string;
        name: string;
        priceMonthly: number;
        watermark: boolean;
        pagesPerMonth: number;
        regenerationsPerMonth: number;
        characterGenerationsPerMonth: number;
        childrenLimit: number | null;
        charactersLimit: number | null;
        retentionDays: number | null;
    };
    status: SubscriptionStatus;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date | null;
    pagesUsed: number;
    regenerationsUsed: number;
    characterGenerationsUsed: number;
    childrenUsed: number;
    talesCount: number;
}

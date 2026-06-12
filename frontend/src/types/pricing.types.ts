/** PricingTier as served by GET /pricing. */
export interface IPricingTier {
    id: string;
    name: string;
    paddleProductId: string | null;
    paddlePriceId: string | null;
    /** Euro cents — format with formatPriceMonthly() at render time. */
    priceMonthly: number;
    pagesPerMonth: number;
    regenerationsPerMonth: number;
    /** Null = unlimited. */
    childrenLimit: number | null;
    /** Null = retained forever. */
    retentionDays: number | null;
    watermark: boolean;
    order: number;
}

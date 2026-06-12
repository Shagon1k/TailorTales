/** Usage summary as served by GET /subscriptions/me. */
export interface IUsageSummary {
    tier: {
        id: string;
        name: string;
        /** Euro cents. */
        priceMonthly: number;
        watermark: boolean;
        pagesPerMonth: number;
        regenerationsPerMonth: number;
        childrenLimit: number | null;
        retentionDays: number | null;
    };
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    pagesUsed: number;
    regenerationsUsed: number;
    childrenUsed: number;
    talesCount: number;
}

/** Invoice line as served by GET /billing/invoices. */
export interface IInvoice {
    date: string;
    description: string;
    /** Smallest currency unit (cents). */
    amount: number;
    currency: string;
    status: string;
    invoicePdfUrl: string | null;
}

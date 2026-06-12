/** View model for a pricing card — DB tier numbers merged with marketing copy. */
export interface IPricingPlan {
    /** PricingTier id from the backend. */
    id: string;
    name: string;
    tagline: string;
    /** Euro cents (matches the API). */
    priceMonthly: number;
    features: string[];
    ctaLabel: string;
    paddlePriceId: string | null;
    mostLoved?: boolean;
}

export type TComparisonCellValue =
    | { type: 'check' }
    | { type: 'dash' }
    | { type: 'text'; value: string };

export interface IComparisonRow {
    feature: string;
    free: TComparisonCellValue;
    storyHour: TComparisonCellValue;
    family: TComparisonCellValue;
}

export interface IComparisonGroup {
    title: string;
    rows: IComparisonRow[];
}

export interface IFaqItem {
    q: string;
    a: string;
}

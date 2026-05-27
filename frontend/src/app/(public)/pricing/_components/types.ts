export type TPricingPlanId = 'free' | 'story-hour' | 'family';

export interface IPricingPlan {
    id: TPricingPlanId;
    name: string;
    tagline: string;
    priceMonthly: number;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
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

export interface IPricingData {
    plans: IPricingPlan[];
    comparison: {
        groups: IComparisonGroup[];
    };
    faq: IFaqItem[];
}

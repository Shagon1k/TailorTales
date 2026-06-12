import type { IPricingTier } from '@/types/pricing.types';
import type { IComparisonGroup, IPricingPlan, TComparisonCellValue } from '../_components/types';
import { PLAN_COPY } from './pricing.constants';

function childrenLabel(limit: number | null): string {
    if (limit === null) return 'Unlimited children';
    return limit === 1 ? '1 child profile' : `Up to ${limit} children`;
}

export function buildFeatures(tier: IPricingTier): string[] {
    const isFree = tier.priceMonthly === 0;

    if (isFree) {
        return [
            `1 tale per month (up to ${tier.pagesPerMonth} pages)`,
            'Watermarked PDF',
            `${tier.regenerationsPerMonth} page regenerations / month`,
            childrenLabel(tier.childrenLimit),
            'All starter art styles',
        ];
    }

    return [
        `Up to ${tier.pagesPerMonth} pages a month`,
        'Books and comics',
        childrenLabel(tier.childrenLimit),
        `${tier.regenerationsPerMonth} page regenerations / month`,
        'No watermark · print-ready',
        'Stories kept forever',
    ];
}

export function toPlan(tier: IPricingTier): IPricingPlan {
    const copy = PLAN_COPY[tier.name] ?? { tagline: '', ctaLabel: 'Choose plan →' };
    return {
        id: tier.id,
        name: tier.name,
        tagline: copy.tagline,
        priceMonthly: tier.priceMonthly,
        features: buildFeatures(tier),
        ctaLabel: copy.ctaLabel,
        paddlePriceId: tier.paddlePriceId,
        mostLoved: copy.mostLoved,
    };
}

export function buildComparisonGroups([
    free,
    storyHour,
    family,
]: IPricingTier[]): IComparisonGroup[] {
    const perTier = (
        build: (tier: IPricingTier) => TComparisonCellValue,
    ): Pick<IComparisonGroup['rows'][number], 'free' | 'storyHour' | 'family'> => ({
        free: build(free),
        storyHour: build(storyHour),
        family: build(family),
    });

    return [
        {
            title: 'Tales & pages',
            rows: [
                {
                    feature: 'Pages per month',
                    ...perTier((t) => ({ type: 'text', value: String(t.pagesPerMonth) })),
                },
                {
                    feature: 'Books and comics',
                    free: { type: 'text', value: 'Books only' },
                    storyHour: { type: 'check' },
                    family: { type: 'check' },
                },
                {
                    feature: 'Children supported',
                    ...perTier((t) => ({
                        type: 'text',
                        value: t.childrenLimit === null ? 'Unlimited' : String(t.childrenLimit),
                    })),
                },
                {
                    feature: 'Page regenerations',
                    ...perTier((t) => ({ type: 'text', value: `${t.regenerationsPerMonth} / mo` })),
                },
            ],
        },
        {
            title: 'Delivery',
            rows: [
                {
                    feature: 'Watermark',
                    ...perTier((t) => ({
                        type: 'text',
                        value: t.watermark ? 'On every page' : 'None',
                    })),
                },
                {
                    feature: 'Print-ready PDF',
                    ...perTier((t) => (t.watermark ? { type: 'dash' } : { type: 'check' })),
                },
                {
                    feature: 'Priority queue',
                    free: { type: 'dash' },
                    storyHour: { type: 'dash' },
                    family: { type: 'check' },
                },
            ],
        },
        {
            title: 'Workshop',
            rows: [
                {
                    feature: 'Stories retained',
                    ...perTier((t) => ({
                        type: 'text',
                        value: t.retentionDays === null ? 'Forever' : `${t.retentionDays} days`,
                    })),
                },
                {
                    feature: 'EN + RU content',
                    free: { type: 'check' },
                    storyHour: { type: 'check' },
                    family: { type: 'check' },
                },
            ],
        },
    ];
}

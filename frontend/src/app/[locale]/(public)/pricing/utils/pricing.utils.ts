import type { IPricingTier } from '@/types/pricing.types';
import type { IComparisonGroup, IPricingPlan, TComparisonCellValue } from '../_components/types';

type TTranslate = (key: string, values?: Record<string, string | number | Date>) => string;

const PLAN_KEY: Record<string, 'free' | 'storyHour' | 'family'> = {
    'Free Chapter': 'free',
    'Story Hour': 'storyHour',
    'Family Workshop': 'family',
};

const MOST_LOVED: Record<string, boolean> = {
    'Story Hour': true,
};

function childrenLabel(limit: number | null, t: TTranslate): string {
    if (limit === null) return t('features.childrenUnlimited');
    if (limit === 1) return t('features.childProfile');
    return t('features.childrenCount', { count: limit });
}

export function buildFeatures(tier: IPricingTier, t: TTranslate): string[] {
    const isFree = tier.priceMonthly === 0;

    if (isFree) {
        return [
            t('features.tale', { pages: tier.pagesPerMonth }),
            t('features.watermarkedPdf'),
            t('features.regenerations', { count: tier.regenerationsPerMonth }),
            childrenLabel(tier.childrenLimit, t),
            t('features.starterArtStyles'),
        ];
    }

    return [
        t('features.pagesPerMonth', { pages: tier.pagesPerMonth }),
        t('features.booksAndComics'),
        childrenLabel(tier.childrenLimit, t),
        t('features.regenerations', { count: tier.regenerationsPerMonth }),
        t('features.noWatermark'),
        t('features.storiesForever'),
    ];
}

export function toPlan(tier: IPricingTier, t: TTranslate): IPricingPlan {
    const key = PLAN_KEY[tier.name] ?? 'free';
    return {
        id: tier.id,
        name: tier.name,
        tagline: t(`${key}.tagline`),
        priceMonthly: tier.priceMonthly,
        features: buildFeatures(tier, t),
        ctaLabel: t(`${key}.cta`),
        paddlePriceId: tier.paddlePriceId,
        mostLoved: MOST_LOVED[tier.name],
    };
}

export function buildComparisonGroups(
    [free, storyHour, family]: IPricingTier[],
    t: TTranslate,
    tv: TTranslate,
): IComparisonGroup[] {
    const perTier = (
        build: (tier: IPricingTier) => TComparisonCellValue,
    ): Pick<IComparisonGroup['rows'][number], 'free' | 'storyHour' | 'family'> => ({
        free: build(free),
        storyHour: build(storyHour),
        family: build(family),
    });

    return [
        {
            title: t('groups.talesAndPages'),
            rows: [
                {
                    feature: t('rows.pagesPerMonth'),
                    ...perTier((tier) => ({ type: 'text', value: String(tier.pagesPerMonth) })),
                },
                {
                    feature: t('rows.booksAndComics'),
                    free: { type: 'text', value: tv('values.booksOnly') },
                    storyHour: { type: 'check' },
                    family: { type: 'check' },
                },
                {
                    feature: t('rows.childrenSupported'),
                    ...perTier((tier) => ({
                        type: 'text',
                        value:
                            tier.childrenLimit === null
                                ? tv('values.unlimited')
                                : String(tier.childrenLimit),
                    })),
                },
                {
                    feature: t('rows.pageRegenerations'),
                    ...perTier((tier) => ({
                        type: 'text',
                        value: tv('values.perMonth', { count: tier.regenerationsPerMonth }),
                    })),
                },
            ],
        },
        {
            title: t('groups.delivery'),
            rows: [
                {
                    feature: t('rows.watermark'),
                    ...perTier((tier) => ({
                        type: 'text',
                        value: tier.watermark ? tv('values.onEveryPage') : tv('values.none'),
                    })),
                },
                {
                    feature: t('rows.printReadyPdf'),
                    ...perTier((tier) => (tier.watermark ? { type: 'dash' } : { type: 'check' })),
                },
            ],
        },
        {
            title: t('groups.workshop'),
            rows: [
                {
                    feature: t('rows.generatedFilesRetained'),
                    ...perTier((tier) => ({
                        type: 'text',
                        value:
                            tier.retentionDays === null
                                ? tv('values.forever')
                                : tv('values.days', { days: tier.retentionDays }),
                    })),
                },
                {
                    feature: t('rows.contentLanguages'),
                    free: { type: 'check' },
                    storyHour: { type: 'check' },
                    family: { type: 'check' },
                },
            ],
        },
    ];
}

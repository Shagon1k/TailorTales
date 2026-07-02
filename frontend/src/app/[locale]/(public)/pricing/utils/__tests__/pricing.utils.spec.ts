import type { IPricingTier } from '@/types/pricing.types';
import { buildComparisonGroups } from '../pricing.utils';

const TIERS: IPricingTier[] = [
    {
        id: 'tier-free',
        name: 'Free Chapter',
        paddleProductId: null,
        paddlePriceId: null,
        priceMonthly: 0,
        pagesPerMonth: 12,
        regenerationsPerMonth: 3,
        childrenLimit: 1,
        retentionDays: 30,
        watermark: true,
        order: 1,
    },
    {
        id: 'tier-story-hour',
        name: 'Story Hour',
        paddleProductId: 'pro_1',
        paddlePriceId: 'pri_1',
        priceMonthly: 500,
        pagesPerMonth: 60,
        regenerationsPerMonth: 10,
        childrenLimit: 3,
        retentionDays: null,
        watermark: false,
        order: 2,
    },
    {
        id: 'tier-family',
        name: 'Family Workshop',
        paddleProductId: 'pro_2',
        paddlePriceId: 'pri_2',
        priceMonthly: 1000,
        pagesPerMonth: 150,
        regenerationsPerMonth: 30,
        childrenLimit: null,
        retentionDays: null,
        watermark: false,
        order: 3,
    },
];

function t(key: string, values?: Record<string, string | number | Date>): string {
    if (key === 'rows.generatedFilesRetained') return 'Generated files retained';
    if (key === 'rows.contentLanguages') return 'Multilingual content';
    if (key === 'values.forever') return 'Forever';
    if (key === 'values.days') return `${values?.days} days`;
    if (key === 'values.perMonth') return `${values?.count} / mo`;
    return key;
}

describe('buildComparisonGroups', () => {
    it('should not advertise an unimplemented priority queue', () => {
        const groups = buildComparisonGroups(TIERS, t, t);
        const rows = groups.flatMap((group) => group.rows);

        expect(rows.some((row) => row.feature === 'rows.priorityQueue')).toBe(false);
    });

    it('should describe retention as generated files instead of whole stories', () => {
        const groups = buildComparisonGroups(TIERS, t, t);
        const rows = groups.flatMap((group) => group.rows);
        const retentionRow = rows.find((row) => row.feature === 'Generated files retained');

        expect(retentionRow).toMatchObject({
            free: { type: 'text', value: '30 days' },
            storyHour: { type: 'text', value: 'Forever' },
            family: { type: 'text', value: 'Forever' },
        });
    });
});

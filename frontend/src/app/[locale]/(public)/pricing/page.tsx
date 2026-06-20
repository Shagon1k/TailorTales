import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pricingServerApi } from '@/api/pricing.server';
import { buildMetadata } from '@/utils/seo.utils';
import CtaSection from '../_components/CtaSection/CtaSection';
import PricingHero from './_components/PricingHero/PricingHero';
import PlansSection from './_components/PlansSection/PlansSection';
import ComparisonTable from './_components/ComparisonTable/ComparisonTable';
import FaqSection from './_components/FaqSection/FaqSection';
import { toPlan, buildComparisonGroups } from './utils/pricing.utils';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const [tSeo, tPage] = await Promise.all([
        getTranslations({ locale, namespace: 'seo' }),
        getTranslations({ locale, namespace: 'pricing.page' }),
    ]);

    return buildMetadata({
        locale,
        path: '/pricing',
        title: tPage('title'),
        description: tPage('description'),
        siteName: tSeo('siteName'),
        ogImageAlt: tSeo('ogImageAlt'),
    });
}

export default async function PricingPage(): Promise<React.ReactElement> {
    const [tiers, tPlans, tTable] = await Promise.all([
        pricingServerApi.getAll(),
        getTranslations('pricing.plans'),
        getTranslations('pricing.comparison.table'),
    ]);

    return (
        <>
            <PricingHero />
            <PlansSection plans={tiers.map((tier) => toPlan(tier, tPlans))} />
            <ComparisonTable groups={buildComparisonGroups(tiers, tTable, tTable)} />
            <FaqSection />
            <CtaSection />
        </>
    );
}

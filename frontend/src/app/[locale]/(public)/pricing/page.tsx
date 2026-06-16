import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { pricingServerApi } from '@/api/pricing.server';
import CtaSection from '../_components/CtaSection/CtaSection';
import PricingHero from './_components/PricingHero/PricingHero';
import PlansSection from './_components/PlansSection/PlansSection';
import ComparisonTable from './_components/ComparisonTable/ComparisonTable';
import FaqSection from './_components/FaqSection/FaqSection';
import { toPlan, buildComparisonGroups } from './utils/pricing.utils';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('pricing.page');
    return { title: t('title') };
}

export default async function PricingPage(): Promise<React.ReactElement> {
    const tiers = await pricingServerApi.getAll();

    return (
        <>
            <PricingHero />
            <PlansSection plans={tiers.map(toPlan)} />
            <ComparisonTable groups={buildComparisonGroups(tiers)} />
            <FaqSection />
            <CtaSection />
        </>
    );
}

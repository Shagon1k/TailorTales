import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import CtaSection from '../_components/CtaSection/CtaSection';
import DetailedStepsSection from './_components/DetailedStepsSection/DetailedStepsSection';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('howItWorks.page');
    return { title: t('title') };
}

export default async function HowItWorksPage(): Promise<React.ReactElement> {
    const t = await getTranslations('howItWorks.hero');

    return (
        <>
            <PageHero
                eyebrow={t('eyebrow')}
                heading={t.rich('heading', {
                    highlight: (chunks) => <HeroHighlight>{chunks}</HeroHighlight>,
                })}
                sub={t('subheading')}
            />
            <DetailedStepsSection />
            <CtaSection />
        </>
    );
}

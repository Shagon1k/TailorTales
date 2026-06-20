import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import { buildMetadata } from '@/utils/seo.utils';
import CtaSection from '../_components/CtaSection/CtaSection';
import DetailedStepsSection from './_components/DetailedStepsSection/DetailedStepsSection';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const [tSeo, tPage] = await Promise.all([
        getTranslations({ locale, namespace: 'seo' }),
        getTranslations({ locale, namespace: 'howItWorks.page' }),
    ]);

    return buildMetadata({
        locale,
        path: '/how-it-works',
        title: tPage('title'),
        description: tPage('description'),
        siteName: tSeo('siteName'),
        ogImageAlt: tSeo('ogImageAlt'),
    });
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

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import PrivacyContent from './_components/PrivacyContent/PrivacyContent';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('privacy.page');
    return { title: t('title') };
}

export default async function PrivacyPage(): Promise<React.ReactElement> {
    const t = await getTranslations('privacy.hero');

    return (
        <>
            <PageHero
                eyebrow={t('eyebrow')}
                heading={t.rich('heading', {
                    highlight: (chunks) => <HeroHighlight>{chunks}</HeroHighlight>,
                })}
                sub={t('subheading')}
            />
            <PrivacyContent />
        </>
    );
}

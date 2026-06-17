import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import ContactSection from './_components/ContactSection/ContactSection';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('contact.page');
    return { title: t('title') };
}

export default async function ContactPage(): Promise<React.ReactElement> {
    const t = await getTranslations('contact.hero');

    return (
        <>
            <PageHero
                eyebrow={t('eyebrow')}
                heading={t.rich('heading', {
                    highlight: (chunks) => <HeroHighlight>{chunks}</HeroHighlight>,
                })}
                sub={t('subheading')}
            />
            <ContactSection email="hello@tailortales.app" />
        </>
    );
}

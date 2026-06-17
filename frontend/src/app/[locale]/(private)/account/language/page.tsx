import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('account.sidebar.nav');
    return { title: t('language') };
}

export default async function LanguagePage(): Promise<React.ReactElement> {
    const t = await getTranslations('account.language');
    return <div>{t('comingSoon')}</div>;
}

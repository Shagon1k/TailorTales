import { getTranslations } from 'next-intl/server';
import LoadingState from '@/components/shared/LoadingState/LoadingState';

export default async function LocalePageLoading(): Promise<React.ReactElement> {
    const t = await getTranslations('common');

    return <LoadingState label={t('loadingPage')} />;
}

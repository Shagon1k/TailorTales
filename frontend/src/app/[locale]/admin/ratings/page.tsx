'use client';

import { useTranslations } from 'next-intl';
import Loader from '@/components/ui/Loader/Loader';
import { useAdminRatings } from '@/hooks/admin';
import RatingsTable from './_components/RatingsTable/RatingsTable';
import styles from './page.module.scss';

export default function RatingsPage(): React.ReactElement {
    const t = useTranslations('admin.ratings');
    const { data, isLoading } = useAdminRatings();

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <h2 className={styles.page__title}>{t('heading')}</h2>
            </div>

            {isLoading || !data ? (
                <Loader label={t('loading')} />
            ) : data.length === 0 ? (
                <p className={styles.page__empty}>{t('empty')}</p>
            ) : (
                <div className={styles['page__table-wrap']}>
                    <RatingsTable ratings={data} />
                </div>
            )}
        </div>
    );
}

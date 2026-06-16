import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { adminServerApi } from '@/api/admin.server';
import StatCard from '@/components/ui/StatCard/StatCard';
import { formatMoney } from '@/utils/money.utils';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
    const [stats, t] = await Promise.all([
        adminServerApi.getStats(),
        getTranslations('admin.dashboard'),
    ]);

    return (
        <div className={styles.page}>
            <h2 className={styles.page__title}>{t('heading')}</h2>
            <div className={styles.page__grid}>
                <StatCard label={t('users')} value={stats.users.toLocaleString()} />
                <StatCard label={t('stories')} value={stats.stories.toLocaleString()} />
                <StatCard
                    label={t('activeSubscriptions')}
                    value={stats.activePaidSubscriptions.toLocaleString()}
                    info={t('activeSubscriptionsInfo')}
                />
                <StatCard
                    label={t('mrr')}
                    value={formatMoney(stats.mrrCents)}
                    info={t('mrrInfo')}
                />
            </div>
        </div>
    );
}

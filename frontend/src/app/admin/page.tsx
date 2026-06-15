import type { Metadata } from 'next';
import { adminServerApi } from '@/api/admin.server';
import StatCard from '@/components/ui/StatCard/StatCard';
import { formatMoney } from '@/utils/money.utils';
import styles from './page.module.scss';

export const metadata: Metadata = { title: 'Admin' };

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
    const stats = await adminServerApi.getStats();

    return (
        <div className={styles.page}>
            <h2 className={styles.page__title}>Overview</h2>
            <div className={styles.page__grid}>
                <StatCard label="Users" value={stats.users.toLocaleString()} />
                <StatCard label="Stories" value={stats.stories.toLocaleString()} />
                <StatCard
                    label="Active subscriptions"
                    value={stats.activePaidSubscriptions.toLocaleString()}
                    info="Paid tiers only"
                />
                <StatCard
                    label="MRR"
                    value={formatMoney(stats.mrrCents)}
                    info="Monthly recurring revenue"
                />
            </div>
        </div>
    );
}

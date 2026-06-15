'use client';

import Loader from '@/components/ui/Loader/Loader';
import { useAdminRatings } from '@/hooks/admin';
import RatingsTable from './_components/RatingsTable/RatingsTable';
import styles from './page.module.scss';

export default function RatingsPage(): React.ReactElement {
    const { data, isLoading } = useAdminRatings();

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <h2 className={styles.page__title}>Ratings</h2>
            </div>

            {isLoading || !data ? (
                <Loader label="Loading ratings" />
            ) : data.length === 0 ? (
                <p className={styles.page__empty}>No ratings yet.</p>
            ) : (
                <div className={styles['page__table-wrap']}>
                    <RatingsTable ratings={data} />
                </div>
            )}
        </div>
    );
}

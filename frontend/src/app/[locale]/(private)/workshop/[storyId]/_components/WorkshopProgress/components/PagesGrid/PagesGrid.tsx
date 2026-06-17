'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import styles from './PagesGrid.module.scss';

export interface IPagesGridProps {
    totalPages: number;
    completedPageOrders: ReadonlySet<number>;
    activePageOrder: number | null;
}

export default function PagesGrid({
    totalPages,
    completedPageOrders,
    activePageOrder,
}: Readonly<IPagesGridProps>): React.ReactElement {
    const t = useTranslations('workshopProgress.pages');

    return (
        <div className={styles.pages}>
            <div className={styles.pages__header}>
                <span>{t('header')}</span>
                <span className={styles.pages__count}>
                    {t('count', { done: completedPageOrders.size, total: totalPages })}
                </span>
            </div>
            <div className={styles.pages__grid}>
                {Array.from({ length: totalPages }, (_, i) => {
                    const order = i + 1;
                    const done = completedPageOrders.has(order);
                    const active = activePageOrder === order;
                    return (
                        <div
                            key={order}
                            className={clsx(styles.thumb, {
                                [styles['m-painted']]: done,
                                [styles['m-active']]: active,
                            })}
                        >
                            {!done && <span className={styles.thumb__num}>{order}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import clsx from 'clsx';
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
    return (
        <div className={styles.pages}>
            <div className={styles.pages__header}>
                <span>Pages so far</span>
                <span className={styles.pages__count}>
                    {completedPageOrders.size} OF {totalPages} PAINTED
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

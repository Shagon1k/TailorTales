'use client';

import Link from 'next/link';
import { VisuallyHidden } from '@mantine/core';
import clsx from 'clsx';
import type { INotification } from '@/types/notification.types';
import { getRelativeTime } from '@/utils/date.utils';
import { getNotificationContent } from './utils/notification-content.utils';
import styles from './NotificationList.module.scss';

export interface INotificationListProps {
    notifications: INotification[];
    /** Fired when a notification is clicked (before navigation). */
    onItemClick?: (notification: INotification) => void;
}

/**
 * Presentational list — no data fetching, so it can be reused outside the
 * header dropdown (e.g. a mobile drawer or a full notifications page).
 */
export default function NotificationList({
    notifications,
    onItemClick,
}: Readonly<INotificationListProps>): React.ReactElement {
    if (notifications.length === 0) {
        return <p className={styles.list__empty}>All quiet for now — new tales will land here.</p>;
    }

    return (
        <ul className={styles.list}>
            {notifications.map((notification) => {
                const { text, href } = getNotificationContent(notification);
                const unread = notification.readAt === null;
                return (
                    <li key={notification.id}>
                        <Link
                            href={href}
                            className={clsx(styles.list__item, { [styles['m-unread']]: unread })}
                            onClick={() => onItemClick?.(notification)}
                        >
                            <span className={styles['list__item-text']}>
                                {text}
                                {unread && <VisuallyHidden> (unread)</VisuallyHidden>}
                            </span>
                            <span className={styles['list__item-time']}>
                                {getRelativeTime(notification.createdAt)}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

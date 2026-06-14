'use client';

import { useEffect, useState } from 'react';
import { Loader } from '@mantine/core';
import Popover from '@/components/ui/Popover/Popover';
import { notificationsApi } from '@/api/notifications';
import {
    useMarkAllNotificationsRead,
    useMarkNotificationRead,
    useNotifications,
} from '@/hooks/notifications';
import type { INotification } from '@/types/notification.types';
import NotificationBell from './components/NotificationBell/NotificationBell';
import NotificationList from './components/NotificationList/NotificationList';
import styles from './NotificationCenter.module.scss';

/** Extracts the count from an SSE `{ type: 'unread-count', count }` message. */
function parseUnreadCountEvent(raw: string): number | null {
    try {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;
        if (!('type' in parsed) || !('count' in parsed)) return null;
        if (parsed.type !== 'unread-count' || typeof parsed.count !== 'number') return null;
        return parsed.count;
    } catch {
        return null;
    }
}

/** Bell + dropdown with the latest notifications, kept live via SSE. */
export default function NotificationCenter(): React.ReactElement {
    const [opened, setOpened] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: notifications } = useNotifications(opened);
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    useEffect(() => {
        // REST snapshot covers the gap before the SSE connection opens.
        notificationsApi
            .getUnreadCount()
            .then(setUnreadCount)
            .catch(() => undefined);

        // EventSource reconnects automatically on connection loss.
        const stream = notificationsApi.openUnreadCountStream();
        stream.onmessage = (event: MessageEvent<string>) => {
            const count = parseUnreadCountEvent(event.data);
            if (count !== null) setUnreadCount(count);
        };
        return () => stream.close();
    }, []);

    const handleItemClick = (notification: INotification): void => {
        setOpened(false);
        if (notification.readAt === null) markRead.mutate(notification.id);
    };

    return (
        <Popover
            opened={opened}
            onChange={setOpened}
            target={
                <NotificationBell
                    count={unreadCount}
                    active={opened}
                    onClick={() => setOpened((value) => !value)}
                />
            }
        >
            <div className={styles.center__header}>
                <span className={styles.center__title} id="notifications-title">
                    Notifications
                </span>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className={styles['center__mark-all']}
                        onClick={() => markAllRead.mutate()}
                    >
                        Mark all as read
                    </button>
                )}
            </div>
            {notifications ? (
                <NotificationList notifications={notifications} onItemClick={handleItemClick} />
            ) : (
                <div className={styles.center__loading}>
                    <Loader size="sm" aria-label="Loading notifications" />
                </div>
            )}
        </Popover>
    );
}

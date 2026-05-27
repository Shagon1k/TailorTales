'use client';

import styles from './NotificationBell.module.scss';

export interface INotificationBellProps {
    /** Unread notification count. Badge hidden when 0 or undefined. */
    count?: number;
    onClick?: () => void;
    /** Set to true when the dropdown is open. */
    active?: boolean;
}

function BellIcon(): React.ReactElement {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <path
                d="M10 2a6 6 0 0 0-6 6v3.5l-1.5 2h15l-1.5-2V8a6 6 0 0 0-6-6Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
            <path
                d="M8.5 16.5a1.5 1.5 0 0 0 3 0"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
}

export default function NotificationBell({
    count = 0,
    onClick,
    active = false,
}: Readonly<INotificationBellProps>): React.ReactElement {
    const hasUnread = count > 0;

    return (
        <button
            type="button"
            aria-label={hasUnread ? `Notifications, ${count} unread` : 'Notifications'}
            aria-expanded={active}
            onClick={onClick}
            className={styles['notification-bell']}
        >
            <BellIcon />
            {hasUnread && (
                <span className={styles['notification-bell__badge']} aria-hidden="true">
                    {count <= 9 ? String(count) : ''}
                </span>
            )}
        </button>
    );
}

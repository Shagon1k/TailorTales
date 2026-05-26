'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import clsx from 'clsx';
import { authApi } from '@/api/auth';
import { useCurrentUser } from '@/context/UserContext';
import styles from './AccountSidebar.module.scss';

interface INavItem {
    href: string;
    label: string;
}

const NAV_ITEMS: INavItem[] = [
    { href: '/account/profile', label: 'Profile' },
    { href: '/account/children', label: 'Children' },
    { href: '/account/subscription', label: 'Subscription' },
    { href: '/account/notifications', label: 'Notifications' },
    { href: '/account/language', label: 'Language' },
    { href: '/account/privacy', label: 'Privacy & data' },
];

export default function AccountSidebar(): React.ReactElement {
    const { user } = useCurrentUser();
    const pathname = usePathname();
    const router = useRouter();
    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

    async function handleSignOut(): Promise<void> {
        try {
            await authApi.logout();
        } catch (err: unknown) {
            console.error('Sign out failed', err);
        }
        router.replace('/login');
    }

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebar__user}>
                <span className={styles['sidebar__user-avatar']} aria-hidden="true">{initial}</span>
                <div className={styles['sidebar__user-info']}>
                    <span className={styles['sidebar__user-name']}>{user?.name}</span>
                    <span className={styles['sidebar__user-email']}>{user?.email}</span>
                </div>
            </div>

            <nav aria-label="Account navigation">
                <ul className={styles.sidebar__nav}>
                    {NAV_ITEMS.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={clsx(styles['sidebar__nav-item'], {
                                    [styles['m-active']]: pathname === item.href,
                                })}
                            >
                                <span className={styles['sidebar__nav-icon']} aria-hidden="true" />
                                {item.label}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <button
                            type="button"
                            className={styles['sidebar__nav-item']}
                        >
                            <span className={styles['sidebar__nav-icon']} aria-hidden="true" />
                            Export library
                        </button>
                    </li>
                </ul>
            </nav>

            <div className={styles.sidebar__actions}>
                <button
                    type="button"
                    className={styles['sidebar__sign-out']}
                    onClick={() => void handleSignOut()}
                >
                    Sign out
                </button>
                <button
                    type="button"
                    className={styles['sidebar__delete']}
                >
                    Delete account
                </button>
            </div>
        </aside>
    );
}

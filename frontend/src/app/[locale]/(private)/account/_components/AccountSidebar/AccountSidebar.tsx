'use client';

import { Link, usePathname } from '@/i18n/navigation';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { authApi } from '@/api/auth';
import Avatar from '@/components/ui/Avatar/Avatar';
import { useCurrentUser } from '@/context/UserContext';
import styles from './AccountSidebar.module.scss';

interface INavItem {
    href: string;
    label: string;
    icon: TIconName;
}

type TIconName =
    | 'profile'
    | 'children'
    | 'subscription'
    | 'notifications'
    | 'privacy'
    | 'signOut'
    | 'delete';

function SidebarIcon({ name }: Readonly<{ name: TIconName }>): React.ReactElement {
    const commonProps = {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    };

    switch (name) {
        case 'profile':
            return (
                <svg {...commonProps}>
                    <path d="M5 20a7 7 0 0 1 14 0" />
                    <circle cx="12" cy="8" r="4" />
                </svg>
            );
        case 'children':
            return (
                <svg {...commonProps}>
                    <circle cx="9" cy="9" r="3" />
                    <circle cx="17" cy="10" r="2.5" />
                    <path d="M3 20a6 6 0 0 1 12 0" />
                    <path d="M14 20a4.5 4.5 0 0 1 7 0" />
                </svg>
            );
        case 'subscription':
            return (
                <svg {...commonProps}>
                    <rect x="3" y="6" width="18" height="12" rx="2.5" />
                    <path d="M3 10h18" />
                </svg>
            );
        case 'notifications':
            return (
                <svg {...commonProps}>
                    <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
                    <path d="M10 19a2 2 0 0 0 4 0" />
                </svg>
            );
        case 'privacy':
            return (
                <svg {...commonProps}>
                    <rect x="4" y="10" width="16" height="10" rx="2.5" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                </svg>
            );
        case 'signOut':
            return (
                <svg {...commonProps}>
                    <path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
                    <path d="M21 12H9" />
                    <path d="m16 7 5 5-5 5" />
                </svg>
            );
        case 'delete':
            return (
                <svg {...commonProps}>
                    <path d="M4 7h16" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
                </svg>
            );
    }
}

export default function AccountSidebar(): React.ReactElement {
    const t = useTranslations('account.sidebar');
    const { user } = useCurrentUser();
    const pathname = usePathname();

    const navItems: INavItem[] = [
        { href: '/account/profile', label: t('nav.profile'), icon: 'profile' },
        { href: '/account/children', label: t('nav.children'), icon: 'children' },
        { href: '/account/subscription', label: t('nav.subscription'), icon: 'subscription' },
        { href: '/account/notifications', label: t('nav.notifications'), icon: 'notifications' },
        { href: '/account/privacy', label: t('nav.privacy'), icon: 'privacy' },
    ];

    async function handleSignOut(): Promise<void> {
        try {
            await authApi.logout();
        } catch (err: unknown) {
            console.error('Sign out failed', err);
        }
        window.location.href = '/';
    }

    return (
        <aside className={styles.sidebar}>
            <div className={styles.sidebar__user}>
                <Avatar
                    size="md"
                    name={user?.name ?? '?'}
                    src={user?.avatarUrl ?? undefined}
                    alt={user?.name ?? 'User avatar'}
                />
                <div className={styles['sidebar__user-info']}>
                    <span className={styles['sidebar__user-name']}>{user?.name}</span>
                    <span className={styles['sidebar__user-email']}>{user?.email}</span>
                </div>
            </div>

            <nav aria-label={t('nav.ariaLabel')}>
                <ul className={styles.sidebar__nav}>
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={clsx(styles['sidebar__nav-item'], {
                                    [styles['m-active']]: pathname === item.href,
                                })}
                            >
                                <span className={styles['sidebar__nav-icon']}>
                                    <SidebarIcon name={item.icon} />
                                </span>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className={styles.sidebar__actions}>
                <button
                    type="button"
                    className={styles['sidebar__sign-out']}
                    onClick={() => void handleSignOut()}
                >
                    <span className={styles['sidebar__nav-icon']}>
                        <SidebarIcon name="signOut" />
                    </span>
                    {t('signOut')}
                </button>
                <Link href="/account/privacy" className={styles['sidebar__delete']}>
                    <span className={styles['sidebar__nav-icon']}>
                        <SidebarIcon name="delete" />
                    </span>
                    {t('deleteAccount')}
                </Link>
            </div>
        </aside>
    );
}

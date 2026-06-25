'use client';

import { Link, usePathname } from '@/i18n/navigation';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { authApi } from '@/api/auth';
import { useCurrentUser } from '@/context/UserContext';
import styles from './AccountSidebar.module.scss';

interface INavItem {
    href: string;
    label: string;
}

export default function AccountSidebar(): React.ReactElement {
    const t = useTranslations('account.sidebar');
    const { user } = useCurrentUser();
    const pathname = usePathname();
    const initial = user?.name?.charAt(0).toUpperCase() ?? '?';

    const navItems: INavItem[] = [
        { href: '/account/profile', label: t('nav.profile') },
        { href: '/account/children', label: t('nav.children') },
        { href: '/account/subscription', label: t('nav.subscription') },
        { href: '/account/notifications', label: t('nav.notifications') },
        { href: '/account/privacy', label: t('nav.privacy') },
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
                <span className={styles['sidebar__user-avatar']} aria-hidden="true">
                    {initial}
                </span>
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
                                <span className={styles['sidebar__nav-icon']} aria-hidden="true" />
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
                    {t('signOut')}
                </button>
                <Link href="/account/privacy" className={styles['sidebar__delete']}>
                    {t('deleteAccount')}
                </Link>
            </div>
        </aside>
    );
}

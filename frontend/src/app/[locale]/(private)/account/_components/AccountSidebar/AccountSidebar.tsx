'use client';

import { Link, usePathname } from '@/i18n/navigation';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import { authApi } from '@/api/auth';
import Avatar from '@/components/ui/Avatar/Avatar';
import Icon, { type TIconName } from '@/components/ui/Icon/Icon';
import DeleteAccountAction from '@/app/[locale]/(private)/account/_components/DeleteAccountAction/DeleteAccountAction';
import { useCurrentUser } from '@/context/UserContext';
import { usePreservedScroll } from '@/hooks/usePreservedScroll';
import styles from './AccountSidebar.module.scss';

const ACCOUNT_SCROLL_KEY = 'account:scroll-y';

interface INavItem {
    href: string;
    label: string;
    icon: TIconName;
}

type TTranslate = (key: string) => string;

function getNavItems(t: TTranslate): INavItem[] {
    return [
        { href: '/account/profile', label: t('nav.profile'), icon: 'user' },
        { href: '/account/children', label: t('nav.children'), icon: 'children' },
        { href: '/account/subscription', label: t('nav.subscription'), icon: 'card' },
        { href: '/account/notifications', label: t('nav.notifications'), icon: 'bell' },
        { href: '/account/privacy', label: t('nav.privacy'), icon: 'lock' },
    ];
}

export default function AccountSidebar(): React.ReactElement {
    const t = useTranslations('account.sidebar');
    const { user } = useCurrentUser();
    const pathname = usePathname();
    const { rememberScrollPosition } = usePreservedScroll({
        storageKey: ACCOUNT_SCROLL_KEY,
        restoreKey: pathname,
    });

    const navItems = getNavItems(t);

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
                                scroll={false}
                                onClick={rememberScrollPosition}
                                className={clsx(styles['sidebar__nav-item'], {
                                    [styles['m-active']]: pathname === item.href,
                                })}
                            >
                                <span className={styles['sidebar__nav-icon']}>
                                    <Icon name={item.icon} />
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
                    onClick={() => handleSignOut()}
                >
                    <span className={styles['sidebar__nav-icon']}>
                        <Icon name="signOut" />
                    </span>
                    {t('signOut')}
                </button>
                <DeleteAccountAction>
                    {({ disabled, openModal }) => (
                        <button
                            type="button"
                            className={styles['sidebar__delete']}
                            disabled={disabled}
                            onClick={() => openModal()}
                        >
                            <span className={styles['sidebar__nav-icon']}>
                                <Icon name="delete" />
                            </span>
                            {t('deleteAccount')}
                        </button>
                    )}
                </DeleteAccountAction>
            </div>
        </aside>
    );
}

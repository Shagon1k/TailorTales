'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import clsx from 'clsx';
import { authApi } from '@/api/auth';
import { useCurrentUser } from '@/context/UserContext';
import { useSubscription } from '@/hooks/subscription';
import { isAdmin } from '@/utils/role.utils';
import Avatar from '@/components/ui/Avatar/Avatar';
import Popover from '@/components/ui/Popover/Popover';
import styles from './HeaderUserChip.module.scss';

interface IMenuLink {
    href: string;
    label: string;
}

export default function HeaderUserChip(): React.ReactElement {
    const { user } = useCurrentUser();
    const { data: subscription } = useSubscription();
    const [opened, setOpened] = useState(false);
    const t = useTranslations('header');
    const firstName = user?.name?.split(' ')[0] ?? '';

    const baseLinks: IMenuLink[] = [
        { href: '/account', label: t('userMenu.myAccount') },
        { href: '/account/subscription', label: t('userMenu.subscription') },
        { href: '/account/children', label: t('userMenu.children') },
    ];
    const menuLinks =
        user && isAdmin(user.role)
            ? [{ href: '/admin', label: t('userMenu.adminPanel') }, ...baseLinks]
            : baseLinks;

    async function handleSignOut(): Promise<void> {
        setOpened(false);
        try {
            await authApi.logout();
        } catch (err: unknown) {
            console.error('Sign out failed', err);
        }
        window.location.href = '/';
    }

    return (
        <Popover
            opened={opened}
            onChange={setOpened}
            maxWidth={220}
            target={
                <button
                    type="button"
                    className={styles.chip}
                    aria-label={t('userChip.ariaLabel')}
                    aria-haspopup="menu"
                    aria-expanded={opened}
                    onClick={() => setOpened((value) => !value)}
                >
                    <Avatar
                        size="sm"
                        name={user?.name ?? '?'}
                        src={user?.avatarUrl ?? undefined}
                        alt={user?.name ?? 'User avatar'}
                        aria-hidden="true"
                    />
                    <span className={styles.chip__info}>
                        <span className={styles.chip__name}>{firstName}</span>
                        <span className={styles.chip__plan}>{subscription?.tier.name ?? '…'}</span>
                    </span>
                </button>
            }
        >
            <ul className={styles.menu}>
                {menuLinks.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className={styles.menu__item}
                            onClick={() => setOpened(false)}
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
                <li>
                    <button
                        type="button"
                        className={clsx(styles.menu__item, styles['m-sign-out'])}
                        onClick={() => void handleSignOut()}
                    >
                        {t('userMenu.signOut')}
                    </button>
                </li>
            </ul>
        </Popover>
    );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { authApi } from '@/api/auth';
import { useCurrentUser } from '@/context/UserContext';
import { useSubscription } from '@/hooks/subscription';
import Avatar from '@/components/ui/Avatar/Avatar';
import Popover from '@/components/ui/Popover/Popover';
import styles from './HeaderUserChip.module.scss';

interface IMenuLink {
    href: string;
    label: string;
}

const MENU_LINKS: IMenuLink[] = [
    { href: '/account', label: 'My account' },
    { href: '/account/subscription', label: 'Subscription' },
    { href: '/account/children', label: 'Children' },
];

export default function HeaderUserChip(): React.ReactElement {
    const { user } = useCurrentUser();
    const { data: subscription } = useSubscription();
    const [opened, setOpened] = useState(false);
    const firstName = user?.name?.split(' ')[0] ?? '';

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
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={opened}
                    onClick={() => setOpened((value) => !value)}
                >
                    <Avatar size="sm" name={user?.name ?? '?'} aria-hidden="true" />
                    <span className={styles.chip__info}>
                        <span className={styles.chip__name}>{firstName}</span>
                        <span className={styles.chip__plan}>{subscription?.tier.name ?? '…'}</span>
                    </span>
                </button>
            }
        >
            <ul className={styles.menu}>
                {MENU_LINKS.map((link) => (
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
                        Sign out
                    </button>
                </li>
            </ul>
        </Popover>
    );
}

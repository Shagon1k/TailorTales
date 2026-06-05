'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import BrandMark from '@/components/ui/BrandMark/BrandMark';
import { fetchUnreadCount, markAllNotificationsRead } from '@/api/notifications';
import HeaderUserChip from './components/HeaderUserChip/HeaderUserChip';
import NotificationBell from './components/NotificationBell/NotificationBell';
import styles from './Header.module.scss';

const POLL_INTERVAL_MS = 30_000;

interface IHeaderProps {
    variant: 'public' | 'private';
}

export default function Header({ variant }: Readonly<IHeaderProps>): React.ReactElement {
    const [scrolled, setScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const onScroll = (): void => setScrolled(window.scrollY > 10);
        const raf = requestAnimationFrame(onScroll);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    useEffect(() => {
        if (variant !== 'private') return;

        const load = (): void => {
            fetchUnreadCount()
                .then(setUnreadCount)
                .catch(() => undefined);
        };

        load();
        const interval = setInterval(load, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [variant]);

    return (
        <header className={styles.header} data-scrolled={scrolled}>
            <div className={styles.header__inner}>
                <BrandMark size="lg" />
                <nav className={styles.header__nav} aria-label="Main navigation">
                    {variant === 'public' ? (
                        <>
                            <Link href="/how-it-works" className={styles.header__link}>
                                How it works
                            </Link>
                            <Link href="/pricing" className={styles.header__link}>
                                Pricing
                            </Link>
                            <Link href="/login" className={styles.header__link}>
                                Sign in
                            </Link>
                            <ButtonLink href="/login">Begin a tale →</ButtonLink>
                        </>
                    ) : (
                        <>
                            <Link href="/library" className={styles.header__link}>
                                Library
                            </Link>
                            <Link href="/workshop" className={styles.header__link}>
                                Workshop
                            </Link>
                            <Link href="/pricing" className={styles.header__link}>
                                Pricing
                            </Link>
                            <span className={styles['header__nav-divider']} aria-hidden="true" />
                            <NotificationBell
                                count={unreadCount}
                                onClick={() => {
                                    setUnreadCount(0);
                                    markAllNotificationsRead().catch(() => undefined);
                                }}
                            />
                            <HeaderUserChip />
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

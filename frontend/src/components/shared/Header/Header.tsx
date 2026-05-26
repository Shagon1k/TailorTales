import Link from 'next/link';
import { Button } from '@mantine/core';
import BrandMark from '@/components/ui/BrandMark/BrandMark';
import HeaderUserChip from './components/HeaderUserChip/HeaderUserChip';
import NotificationBell from './components/NotificationBell/NotificationBell';
import styles from './Header.module.scss';

interface IHeaderProps {
    variant: 'public' | 'private';
}

export default function Header({ variant }: Readonly<IHeaderProps>): React.ReactElement {
    return (
        <header className={styles.header}>
            <div className={styles.header__inner}>
                <BrandMark size="sm" />
                <nav className={styles.header__nav} aria-label="Main navigation">
                    {variant === 'public' ? (
                        <>
                            <Link href="/how-it-works" className={styles.header__link}>How it works</Link>
                            <Link href="/pricing" className={styles.header__link}>Pricing</Link>
                            <Link href="/sign-in" className={styles.header__link}>Sign in</Link>
                            <Button component={Link} href="/sign-up" radius="xl" className={styles.header__cta}>
                                Begin a tale →
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/account/library" className={styles.header__link}>Library</Link>
                            <Link href="/account/workshop" className={styles.header__link}>Workshop</Link>
                            <Link href="/account/children" className={styles.header__link}>Children</Link>
                            <span className={styles['header__nav-divider']} aria-hidden="true" />
                            <NotificationBell />
                            <HeaderUserChip />
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

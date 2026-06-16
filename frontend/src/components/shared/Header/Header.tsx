'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import BrandMark from '@/components/ui/BrandMark/BrandMark';
import HeaderUserChip from './components/HeaderUserChip/HeaderUserChip';
import NotificationCenter from './components/NotificationCenter/NotificationCenter';
import styles from './Header.module.scss';

interface IHeaderProps {
    variant: 'public' | 'private';
}

export default function Header({ variant }: Readonly<IHeaderProps>): React.ReactElement {
    const [scrolled, setScrolled] = useState(false);
    const t = useTranslations('header');

    useEffect(() => {
        const onScroll = (): void => setScrolled(window.scrollY > 10);
        const raf = requestAnimationFrame(onScroll);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    return (
        <header className={styles.header} data-scrolled={scrolled}>
            <div className={styles.header__inner}>
                <BrandMark size="lg" />
                <nav className={styles.header__nav} aria-label={t('nav.ariaLabel')}>
                    {variant === 'public' ? (
                        <>
                            <Link href="/how-it-works" className={styles.header__link}>
                                {t('nav.howItWorks')}
                            </Link>
                            <Link href="/pricing" className={styles.header__link}>
                                {t('nav.pricing')}
                            </Link>
                            <Link href="/login" className={styles.header__link}>
                                {t('nav.signIn')}
                            </Link>
                            <ButtonLink href="/login">{t('nav.cta')}</ButtonLink>
                        </>
                    ) : (
                        <>
                            <Link href="/library" className={styles.header__link}>
                                {t('nav.library')}
                            </Link>
                            <Link href="/workshop" className={styles.header__link}>
                                {t('nav.workshop')}
                            </Link>
                            <Link href="/pricing" className={styles.header__link}>
                                {t('nav.pricing')}
                            </Link>
                            <span className={styles['header__nav-divider']} aria-hidden="true" />
                            <NotificationCenter />
                            <HeaderUserChip />
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { authApi } from '@/api/auth';
import Icon from '@/components/ui/Icon/Icon';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing, type ILocale } from '@/i18n/config';
import {
    PUBLIC_SECONDARY_ROUTES,
    SECONDARY_ROUTES,
    type TNavRoute,
    getAccountLinks,
    getMoreLinks,
    getPrimaryLinks,
    getPublicMoreLinks,
    getPublicPrimaryLinks,
} from './MobileFooterNav.config';
import styles from './MobileFooterNav.module.scss';

interface IMobileFooterNavProps {
    authenticated: boolean;
}

type TViewTransitionDocument = Document & {
    startViewTransition: (callback: () => void) => void;
};

function normalizeLocale(locale: string): ILocale {
    if (locale === 'en' || locale === 'ru' || locale === 'de') return locale;
    return routing.defaultLocale;
}

function hasViewTransition(documentRef: Document): documentRef is TViewTransitionDocument {
    return (
        'startViewTransition' in documentRef &&
        typeof documentRef.startViewTransition === 'function'
    );
}

function isCurrentPath(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}

function getCurrentRoute(pathname: string, authenticated: boolean): TNavRoute | null {
    if (isCurrentPath(pathname, '/library')) return 'library';
    if (isCurrentPath(pathname, '/workshop')) return 'workshop';
    if (isCurrentPath(pathname, '/pricing')) return 'pricing';
    if (isCurrentPath(pathname, '/how-it-works')) return 'howItWorks';
    if (isCurrentPath(pathname, '/account')) return 'account';
    if (!authenticated && isCurrentPath(pathname, '/login')) return 'account';

    const secondaryRoutes = authenticated ? SECONDARY_ROUTES : PUBLIC_SECONDARY_ROUTES;
    if (secondaryRoutes.some((href) => isCurrentPath(pathname, href))) return 'more';
    return null;
}

export default function MobileFooterNav({
    authenticated,
}: Readonly<IMobileFooterNavProps>): React.ReactElement {
    const t = useTranslations('mobileFooterNav');
    const tAccount = useTranslations('account.sidebar');
    const pathname = usePathname();
    const router = useRouter();
    const locale = normalizeLocale(useLocale());
    const [moreOpen, setMoreOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const currentRoute = getCurrentRoute(pathname, authenticated);
    const sheetOpen = moreOpen || accountOpen;

    function closeSheets(): void {
        setMoreOpen(false);
        setAccountOpen(false);
    }

    useEffect(() => {
        if (!sheetOpen) return undefined;

        const onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') closeSheets();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [sheetOpen]);

    const primaryLinks = authenticated ? getPrimaryLinks(t) : getPublicPrimaryLinks(t);
    const moreLinks = authenticated ? getMoreLinks(t) : getPublicMoreLinks(t);
    const accountLinks = getAccountLinks(tAccount);

    function toggleAccount(): void {
        setAccountOpen((open) => !open);
        setMoreOpen(false);
    }

    function toggleMore(): void {
        setMoreOpen((open) => !open);
        setAccountOpen(false);
    }

    function switchLocale(nextLocale: ILocale): void {
        closeSheets();

        const navigate = (): void => {
            router.replace(pathname, { locale: nextLocale });
        };

        if (hasViewTransition(document)) {
            document.startViewTransition(navigate);
        } else {
            navigate();
        }
    }

    async function handleSignOut(): Promise<void> {
        closeSheets();
        try {
            await authApi.logout();
        } catch (err: unknown) {
            console.error('Sign out failed', err);
        }
        window.location.href = '/';
    }

    return (
        <>
            {sheetOpen && (
                <button
                    type="button"
                    className={styles.scrim}
                    aria-label={accountOpen ? t('account.closeBackdrop') : t('more.closeBackdrop')}
                    onClick={closeSheets}
                />
            )}
            {accountOpen && (
                <aside
                    id="mobile-footer-account"
                    className={styles.sheet}
                    aria-label={t('account.ariaLabel')}
                >
                    <div className={styles.sheet__content}>
                        <div className={styles.sheet__links}>
                            {accountLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={styles.sheet__link}
                                    aria-current={
                                        isCurrentPath(pathname, link.href) ? 'page' : undefined
                                    }
                                    onClick={closeSheets}
                                >
                                    <Icon name={link.icon} tone="accent" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                        <div className={styles.sheet__actions}>
                            <button
                                type="button"
                                className={styles.sheet__action}
                                onClick={() => handleSignOut()}
                            >
                                <Icon name="signOut" tone="accent" />
                                <span>{tAccount('signOut')}</span>
                            </button>
                            <Link
                                href="/account/privacy"
                                className={clsx(styles.sheet__action, styles['m-danger'])}
                                onClick={closeSheets}
                            >
                                <Icon name="delete" tone="danger" />
                                <span>{tAccount('deleteAccount')}</span>
                            </Link>
                        </div>
                    </div>
                </aside>
            )}
            {moreOpen && (
                <aside
                    id="mobile-footer-more"
                    className={styles.sheet}
                    aria-label={t('more.ariaLabel')}
                >
                    <div className={styles.sheet__content}>
                        <div className={styles.language} aria-label={t('language.ariaLabel')}>
                            <span className={styles.language__label}>
                                <Icon name="globe" tone="accent" />
                                <span>{t('language.label')}</span>
                            </span>
                            <span className={styles.language__options}>
                                {routing.locales.map((nextLocale) => (
                                    <button
                                        key={nextLocale}
                                        type="button"
                                        className={styles.language__option}
                                        aria-current={locale === nextLocale}
                                        onClick={() => switchLocale(nextLocale)}
                                    >
                                        {nextLocale.toUpperCase()}
                                    </button>
                                ))}
                            </span>
                        </div>
                        <div className={styles.sheet__links}>
                            {moreLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={styles.sheet__link}
                                    aria-current={
                                        isCurrentPath(pathname, link.href) ? 'page' : undefined
                                    }
                                    onClick={closeSheets}
                                >
                                    <Icon name={link.icon} tone="accent" />
                                    <span>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </aside>
            )}
            <nav className={styles.nav} aria-label={t('ariaLabel')}>
                <div className={styles.nav__inner}>
                    {primaryLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.nav__item}
                            aria-current={currentRoute === link.route ? 'page' : undefined}
                            onClick={closeSheets}
                        >
                            <Icon name={link.icon} tone="accent" size="lg" />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                    {authenticated ? (
                        <button
                            type="button"
                            className={styles.nav__item}
                            aria-current={currentRoute === 'account' ? 'page' : undefined}
                            aria-expanded={accountOpen}
                            aria-controls="mobile-footer-account"
                            aria-label={accountOpen ? t('account.close') : t('account.open')}
                            onClick={toggleAccount}
                        >
                            <Icon name="user" tone="accent" size="lg" />
                            <span>{t('items.account')}</span>
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            className={styles.nav__item}
                            aria-current={currentRoute === 'account' ? 'page' : undefined}
                            onClick={closeSheets}
                        >
                            <Icon name="key" tone="accent" size="lg" />
                            <span>{t('items.signIn')}</span>
                        </Link>
                    )}
                    <button
                        type="button"
                        className={clsx(styles.nav__item, styles['m-more'])}
                        aria-current={currentRoute === 'more' ? 'page' : undefined}
                        aria-expanded={moreOpen}
                        aria-controls="mobile-footer-more"
                        aria-label={moreOpen ? t('more.close') : t('more.open')}
                        onClick={toggleMore}
                    >
                        <Icon name="menu" tone="accent" size="lg" />
                        <span>{t('items.more')}</span>
                    </button>
                </div>
            </nav>
        </>
    );
}

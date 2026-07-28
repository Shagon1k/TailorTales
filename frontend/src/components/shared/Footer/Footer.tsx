import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from './Footer.module.scss';

const BUILD_SHA =
    process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === 'uat'
        ? process.env.NEXT_PUBLIC_BUILD_SHA
        : undefined;

export default async function Footer(): Promise<React.ReactElement> {
    const t = await getTranslations('footer');

    return (
        <footer className={styles.footer}>
            <div className={styles.footer__inner}>
                <div className={styles.footer__brand}>
                    <Link href="/" className={styles.footer__wordmark}>
                        {t('brandName')}
                    </Link>
                    <p className={styles.footer__tagline}>{t('tagline')}</p>
                </div>
                <nav className={styles.footer__links} aria-label={t('nav.ariaLabel')}>
                    <Link href="/how-it-works" className={styles.footer__link}>
                        {t('nav.howItWorks')}
                    </Link>
                    <span className={styles.footer__separator} aria-hidden="true">
                        ·
                    </span>
                    <Link href="/privacy" className={styles.footer__link}>
                        {t('nav.privacy')}
                    </Link>
                    <span className={styles.footer__separator} aria-hidden="true">
                        ·
                    </span>
                    <Link href="/contact" className={styles.footer__link}>
                        {t('nav.contact')}
                    </Link>
                </nav>
                {BUILD_SHA ? (
                    <small className={styles.footer__build} aria-label={t('build.label')}>
                        {BUILD_SHA}
                    </small>
                ) : null}
            </div>
        </footer>
    );
}

'use client';

import { GoogleAnalytics } from '@next/third-parties/google';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import { setAnalyticsConsent, useAnalyticsConsent } from '@/lib/analytics-consent';
import styles from './CookieConsent.module.scss';

export default function CookieConsent(): React.ReactElement | null {
    const t = useTranslations('cookieConsent');
    const consent = useAnalyticsConsent();

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    return (
        <>
            {consent === 'accepted' && gaId && <GoogleAnalytics gaId={gaId} />}
            {consent === 'undecided' && (
                <div className={styles.banner} role="dialog" aria-label={t('ariaLabel')}>
                    <p className={styles.banner__text}>{t('body')}</p>
                    <div className={styles.banner__actions}>
                        <Button
                            variant="secondary"
                            size="default"
                            onClick={() => setAnalyticsConsent('rejected')}
                        >
                            {t('reject')}
                        </Button>
                        <Button
                            variant="primary"
                            size="default"
                            onClick={() => setAnalyticsConsent('accepted')}
                        >
                            {t('accept')}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}

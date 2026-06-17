'use client';

import { useSyncExternalStore } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import styles from './CookieConsent.module.scss';

const STORAGE_KEY = 'tt_cookie_consent';

// 'pending' is the server/pre-hydration snapshot: the banner stays hidden until
// the client has read localStorage, avoiding a flash for users who already chose.
// 'undecided' means no stored choice yet — that's the only state that shows the banner.
type TConsent = 'accepted' | 'rejected' | 'undecided' | 'pending';

const listeners = new Set<() => void>();

// localStorage is an external store; subscribe per React's useSyncExternalStore
// contract. The native `storage` event covers other tabs; our own writes notify
// via the listener set since `storage` doesn't fire in the writing tab.
function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);
    window.addEventListener('storage', onChange);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onChange);
    };
}

function getSnapshot(): TConsent {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : 'undecided';
}

function getServerSnapshot(): TConsent {
    return 'pending';
}

function setConsent(value: 'accepted' | 'rejected'): void {
    localStorage.setItem(STORAGE_KEY, value);
    for (const listener of listeners) {
        listener();
    }
}

export default function CookieConsent(): React.ReactElement | null {
    const t = useTranslations('cookieConsent');
    const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

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
                            onClick={() => setConsent('rejected')}
                        >
                            {t('reject')}
                        </Button>
                        <Button
                            variant="primary"
                            size="default"
                            onClick={() => setConsent('accepted')}
                        >
                            {t('accept')}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}

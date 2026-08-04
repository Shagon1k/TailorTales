'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tt_cookie_consent';

// 'pending' is used during SSR; it prevents consent-dependent behavior before hydration.
export type TAnalyticsConsent = 'accepted' | 'rejected' | 'undecided' | 'pending';

const listeners = new Set<() => void>();

function readConsent(): TAnalyticsConsent {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'accepted' || stored === 'rejected' ? stored : 'undecided';
}

function subscribe(onChange: () => void): () => void {
    const onStorageChange = (event: StorageEvent): void => {
        if (event.key === STORAGE_KEY) onChange();
    };

    listeners.add(onChange);
    window.addEventListener('storage', onStorageChange);

    return () => {
        listeners.delete(onChange);
        window.removeEventListener('storage', onStorageChange);
    };
}

export function getAnalyticsConsent(): TAnalyticsConsent {
    return typeof window === 'undefined' ? 'pending' : readConsent();
}

export function useAnalyticsConsent(): TAnalyticsConsent {
    return useSyncExternalStore(subscribe, getAnalyticsConsent, () => 'pending');
}

export function setAnalyticsConsent(consent: 'accepted' | 'rejected'): void {
    localStorage.setItem(STORAGE_KEY, consent);
    for (const listener of listeners) listener();
}

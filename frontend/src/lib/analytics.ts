'use client';

import { useCallback, useRef } from 'react';
import { sendGAEvent } from '@next/third-parties/google';
import {
    getAnalyticsConsent,
    useAnalyticsConsent,
    type TAnalyticsConsent,
} from './analytics-consent';

export const ANALYTICS_EVENTS = {
    signUp: 'sign_up',
    beginCheckout: 'begin_checkout',
    storyGenerationStarted: 'story_generation_started',
    storyGenerationCompleted: 'story_generation_completed',
    subscriptionActivated: 'subscription_activated',
} as const;

type TAnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
type TAnalyticsEventParameter = string | number | boolean;

interface IAnalyticsEvent {
    name: TAnalyticsEventName;
    parameters?: Record<string, TAnalyticsEventParameter>;
}

interface IUseTrackAnalyticsResult {
    consent: TAnalyticsConsent;
    track: (event: IAnalyticsEvent) => boolean;
    trackOnce: (key: string, event: IAnalyticsEvent) => boolean;
}

/**
 * Sends a product event only after the consent-gated GA script is mounted.
 * Event parameters must remain aggregate metadata; never include PII or story content.
 */
function trackAnalyticsEvent({ name, parameters }: IAnalyticsEvent): boolean {
    if (
        typeof window === 'undefined' ||
        !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
        getAnalyticsConsent() !== 'accepted'
    ) {
        return false;
    }

    const gaScript = document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    if (!gaScript) return false;

    sendGAEvent('event', name, parameters ?? {});
    return true;
}

/**
 * Provides consent-aware event tracking for a component. `trackOnce` deduplicates a
 * logical event for that component lifetime; a blocked or failed send remains retryable.
 */
export function useTrackAnalytics(): IUseTrackAnalyticsResult {
    const consent = useAnalyticsConsent();
    const trackedKeysRef = useRef(new Set<string>());

    const track = useCallback((event: IAnalyticsEvent): boolean => trackAnalyticsEvent(event), []);

    const trackOnce = useCallback(
        (key: string, event: IAnalyticsEvent): boolean => {
            if (trackedKeysRef.current.has(key) || !track(event)) return false;

            trackedKeysRef.current.add(key);
            return true;
        },
        [track],
    );

    return { consent, track, trackOnce };
}

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ANALYTICS_EVENTS, useTrackAnalytics } from '@/lib/analytics';

function clearSignupSearchParam(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('signup');
    window.history.replaceState(window.history.state, '', url);
}

export default function SignupTracker(): null {
    const searchParams = useSearchParams();
    const signupCompleted = searchParams.get('signup') === 'completed';
    const { consent, trackOnce } = useTrackAnalytics();

    useEffect(() => {
        if (!signupCompleted || consent !== 'accepted') return;

        if (
            !trackOnce('sign_up:google', {
                name: ANALYTICS_EVENTS.signUp,
                parameters: { method: 'google' },
            })
        ) {
            return;
        }

        clearSignupSearchParam();
    }, [consent, signupCompleted, trackOnce]);

    return null;
}

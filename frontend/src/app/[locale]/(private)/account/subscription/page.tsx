'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Stack } from '@mantine/core';
import { billingApi } from '@/api/billing';
import { ANALYTICS_EVENTS, useTrackAnalytics } from '@/lib/analytics';
import LoadingState from '@/components/shared/LoadingState/LoadingState';
import { useSubscription } from '@/hooks/subscription';
import PlanCard from './_components/PlanCard/PlanCard';
import UsageBars from './_components/UsageBars/UsageBars';
import PaymentDetails from './_components/PaymentDetails/PaymentDetails';
import InvoiceList from './_components/InvoiceList/InvoiceList';
import styles from './page.module.scss';

const CHECKOUT_POLL_INTERVAL_MS = 2000;
const CHECKOUT_POLL_MAX_ATTEMPTS = 10;

function clearCheckoutSearchParams(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('checkout');
    url.searchParams.delete('plan');
    window.history.replaceState(window.history.state, '', url);
}

export default function SubscriptionPage(): React.ReactElement {
    const { data: subscription, refetch } = useSubscription();
    const searchParams = useSearchParams();
    const checkoutSucceeded = searchParams.get('checkout') === 'success';
    const checkoutPlanId = searchParams.get('plan');
    const { consent, trackOnce } = useTrackAnalytics();
    const isPaid = subscription !== undefined && subscription.tier.priceMonthly > 0;
    const [checkoutSyncTimedOut, setCheckoutSyncTimedOut] = useState(false);
    const isCheckoutSyncing = checkoutSucceeded && !isPaid && !checkoutSyncTimedOut;

    // After overlay checkout the webhook may lag the redirect by a few seconds —
    // poll until the paid tier shows up (or give up quietly).
    useEffect(() => {
        if (!checkoutSucceeded || isPaid) return;

        let attempts = 0;
        let isSyncing = false;
        let isDisposed = false;
        let timer: ReturnType<typeof setTimeout> | undefined;

        async function syncSubscription(): Promise<void> {
            if (isSyncing) return;
            attempts += 1;
            if (attempts > CHECKOUT_POLL_MAX_ATTEMPTS) {
                if (!isDisposed) setCheckoutSyncTimedOut(true);
                return;
            }

            isSyncing = true;
            try {
                await billingApi.sync();
            } catch (err: unknown) {
                console.error('Subscription sync failed', err);
            } finally {
                isSyncing = false;
                await refetch();
                if (!isDisposed) {
                    timer = setTimeout(() => syncSubscription(), CHECKOUT_POLL_INTERVAL_MS);
                }
            }
        }

        timer = setTimeout(() => syncSubscription(), 0);

        return () => {
            isDisposed = true;
            if (timer) clearTimeout(timer);
        };
    }, [checkoutSucceeded, isPaid, refetch]);

    useEffect(() => {
        if (!checkoutSucceeded || !isPaid || !subscription || consent !== 'accepted') {
            return;
        }

        if (
            !trackOnce(`subscription_activated:${checkoutPlanId ?? subscription.tier.id}`, {
                name: ANALYTICS_EVENTS.subscriptionActivated,
                parameters: {
                    plan_id: checkoutPlanId ?? subscription.tier.id,
                    subscription_tier_id: subscription.tier.id,
                },
            })
        ) {
            return;
        }

        clearCheckoutSearchParams();
    }, [checkoutPlanId, checkoutSucceeded, consent, isPaid, subscription, trackOnce]);

    const t = useTranslations('account.subscription');

    if (!subscription) {
        return (
            <div className={styles.page}>
                <LoadingState variant="container" label={t('loading')} />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {checkoutSyncTimedOut && (
                <p className={styles.page__status} role="status">
                    {t('checkoutDelayed')}
                </p>
            )}
            <div aria-busy={isCheckoutSyncing || undefined}>
                <Stack gap="xl">
                    <PlanCard subscription={subscription} />
                    <UsageBars subscription={subscription} />
                    {isPaid && <PaymentDetails />}
                    <InvoiceList isPaid={isPaid} />
                </Stack>
            </div>
            {isCheckoutSyncing && <LoadingState variant="overlay" label={t('checkoutSyncing')} />}
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Stack } from '@mantine/core';
import { useSubscription } from '@/hooks/subscription';
import PlanCard from './_components/PlanCard/PlanCard';
import UsageBars from './_components/UsageBars/UsageBars';
import PaymentDetails from './_components/PaymentDetails/PaymentDetails';
import InvoiceList from './_components/InvoiceList/InvoiceList';

const CHECKOUT_POLL_INTERVAL_MS = 2000;
const CHECKOUT_POLL_MAX_ATTEMPTS = 10;

export default function SubscriptionPage(): React.ReactElement {
    const { data: subscription, refetch } = useSubscription();
    const searchParams = useSearchParams();
    const checkoutSucceeded = searchParams.get('checkout') === 'success';
    const isPaid = subscription !== undefined && subscription.tier.priceMonthly > 0;

    // After overlay checkout the webhook may lag the redirect by a few seconds —
    // poll until the paid tier shows up (or give up quietly).
    useEffect(() => {
        if (!checkoutSucceeded || isPaid) return;

        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            if (attempts > CHECKOUT_POLL_MAX_ATTEMPTS) {
                clearInterval(timer);
                return;
            }
            refetch();
        }, CHECKOUT_POLL_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [checkoutSucceeded, isPaid, refetch]);

    if (!subscription) {
        return <p>Loading your subscription…</p>;
    }

    return (
        <Stack gap="xl">
            <PlanCard subscription={subscription} />
            <UsageBars subscription={subscription} />
            {isPaid && <PaymentDetails />}
            <InvoiceList isPaid={isPaid} />
        </Stack>
    );
}

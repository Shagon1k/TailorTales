'use client';

import { Stack } from '@mantine/core';
import { useSubscription } from '@/hooks/subscription';
import PrivacyInfo from './_components/PrivacyInfo/PrivacyInfo';
import ExportSection from './_components/ExportSection/ExportSection';
import DeleteAccountSection from './_components/DeleteAccountSection/DeleteAccountSection';

export default function PrivacyPage(): React.ReactElement {
    const { data: subscription } = useSubscription();
    const hasPaidSubscription =
        subscription !== undefined &&
        subscription.tier.priceMonthly > 0 &&
        !subscription.cancelAtPeriodEnd;

    return (
        <Stack gap="xl">
            <PrivacyInfo />
            <ExportSection />
            <DeleteAccountSection hasPaidSubscription={hasPaidSubscription} />
        </Stack>
    );
}

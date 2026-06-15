'use client';

import { useState } from 'react';
import { Group, Stack } from '@mantine/core';
import { billingApi } from '@/api/billing';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './PaymentDetails.module.scss';

export default function PaymentDetails(): React.ReactElement {
    const [isOpening, setIsOpening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function openPortal(): Promise<void> {
        setIsOpening(true);
        setError(null);
        try {
            const { url } = await billingApi.createPortalSession();
            window.open(url, '_blank', 'noopener');
        } catch {
            setError('Could not open the billing portal — please try again.');
        } finally {
            setIsOpening(false);
        }
    }

    return (
        <Card variant="default" size="md">
            <Stack gap="sm">
                <CapsLabel>Payment details</CapsLabel>
                <p className={styles['payment-details__copy']}>
                    Your card, billing address, and Tax ID are managed securely by Paddle — we never
                    store them. Plan changes also happen in the Paddle portal.
                </p>
                <Group>
                    <Button variant="secondary" onClick={() => openPortal()} loading={isOpening}>
                        Open billing portal →
                    </Button>
                </Group>
                {error && <p className={styles['payment-details__error']}>{error}</p>}
            </Stack>
        </Card>
    );
}

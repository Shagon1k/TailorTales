'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Group, Stack } from '@mantine/core';
import { billingApi } from '@/api/billing';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './PaymentDetails.module.scss';

export default function PaymentDetails(): React.ReactElement {
    const t = useTranslations('account.subscription.payment');
    const [isOpening, setIsOpening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function openPortal(): Promise<void> {
        setIsOpening(true);
        setError(null);
        try {
            const { url } = await billingApi.createPortalSession();
            window.open(url, '_blank', 'noopener');
        } catch {
            setError(t('error'));
        } finally {
            setIsOpening(false);
        }
    }

    return (
        <Card variant="default" size="md">
            <Stack gap="sm">
                <CapsLabel>{t('eyebrow')}</CapsLabel>
                <p className={styles['payment-details__copy']}>{t('body')}</p>
                <Group>
                    <Button variant="secondary" onClick={() => openPortal()} loading={isOpening}>
                        {t('portalButton')}
                    </Button>
                </Group>
                {error && <p className={styles['payment-details__error']}>{error}</p>}
            </Stack>
        </Card>
    );
}

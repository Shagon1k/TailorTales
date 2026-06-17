'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Group, Stack } from '@mantine/core';
import Button from '@/components/ui/Button/Button';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Modal from '@/components/ui/Modal/Modal';
import Tag from '@/components/ui/Tag/Tag';
import { useCancelSubscription } from '@/hooks/subscription';
import { formatLongDate } from '@/utils/date.utils';
import { formatMoney } from '@/utils/money.utils';
import type { IUsageSummary } from '@/types/subscription.types';
import styles from './PlanCard.module.scss';

interface IPlanCardProps {
    subscription: IUsageSummary;
}

export default function PlanCard({ subscription }: Readonly<IPlanCardProps>): React.ReactElement {
    const t = useTranslations('account.subscription.planCard');
    const { tier, status, cancelAtPeriodEnd, currentPeriodEnd } = subscription;
    const isPaid = tier.priceMonthly > 0;
    const [confirmOpen, setConfirmOpen] = useState(false);
    const { mutate: cancelSubscription, isPending: isCanceling } = useCancelSubscription();

    function handleCancel(): void {
        cancelSubscription(undefined, { onSuccess: () => setConfirmOpen(false) });
    }

    return (
        <Card variant="gradient" size="md">
            <Stack gap="sm">
                <CapsLabel>{t('eyebrow')}</CapsLabel>

                {status === 'PAST_DUE' && (
                    <p className={styles['plan-card__warning']}>{t('pastDueWarning')}</p>
                )}

                <Group justify="space-between" align="baseline">
                    <h3 className={styles['plan-card__name']}>{tier.name}</h3>
                    <span className={styles['plan-card__price']}>
                        {isPaid
                            ? t('pricePerMonth', { price: formatMoney(tier.priceMonthly) })
                            : t('priceFree')}
                    </span>
                </Group>

                {cancelAtPeriodEnd && currentPeriodEnd && (
                    <Tag variant="warm">
                        {t('cancelsOn', { date: formatLongDate(currentPeriodEnd) })}
                    </Tag>
                )}

                {isPaid && currentPeriodEnd && !cancelAtPeriodEnd && (
                    <p className={styles['plan-card__renewal']}>
                        {t('renewsOnPaid', { date: formatLongDate(currentPeriodEnd) })}
                    </p>
                )}

                {!isPaid && currentPeriodEnd && (
                    <p className={styles['plan-card__renewal']}>
                        {t('resetsOn', { date: formatLongDate(currentPeriodEnd) })}
                    </p>
                )}

                <Group gap="sm">
                    {!isPaid && (
                        <ButtonLink href="/pricing" variant="primary">
                            {t('upgradeButton')}
                        </ButtonLink>
                    )}
                    {isPaid && !cancelAtPeriodEnd && (
                        <Button variant="quiet" onClick={() => setConfirmOpen(true)}>
                            {t('cancelButton')}
                        </Button>
                    )}
                </Group>
            </Stack>

            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title={t('cancelModal.title')}
                size="sm"
            >
                <Stack gap="md">
                    <p>
                        {t('cancelModal.body', {
                            tierName: tier.name,
                            date: currentPeriodEnd ? formatLongDate(currentPeriodEnd) : '',
                        })}
                    </p>
                    <Group justify="flex-end" gap="sm">
                        <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
                            {t('cancelModal.keepButton')}
                        </Button>
                        <Button variant="primary" onClick={handleCancel} loading={isCanceling}>
                            {t('cancelModal.confirmButton')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
}

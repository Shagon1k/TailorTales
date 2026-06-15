'use client';

import { useState } from 'react';
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
                <CapsLabel>Current plan</CapsLabel>

                {status === 'PAST_DUE' && (
                    <p className={styles['plan-card__warning']}>
                        Your last payment didn&apos;t go through — we&apos;ll retry automatically.
                        Please check your payment method to keep the workshop open.
                    </p>
                )}

                <Group justify="space-between" align="baseline">
                    <h3 className={styles['plan-card__name']}>{tier.name}</h3>
                    <span className={styles['plan-card__price']}>
                        {isPaid ? `${formatMoney(tier.priceMonthly)} / month` : 'Free forever'}
                    </span>
                </Group>

                {cancelAtPeriodEnd && currentPeriodEnd && (
                    <Tag variant="warm">Cancels on {formatLongDate(currentPeriodEnd)}</Tag>
                )}

                {isPaid && currentPeriodEnd && !cancelAtPeriodEnd && (
                    <p className={styles['plan-card__renewal']}>
                        Renews on {formatLongDate(currentPeriodEnd)} · VAT calculated by Paddle at
                        checkout
                    </p>
                )}

                {!isPaid && currentPeriodEnd && (
                    <p className={styles['plan-card__renewal']}>
                        Resets on {formatLongDate(currentPeriodEnd)}
                    </p>
                )}

                <Group gap="sm">
                    {!isPaid && (
                        <ButtonLink href="/pricing" variant="primary">
                            Upgrade →
                        </ButtonLink>
                    )}
                    {isPaid && !cancelAtPeriodEnd && (
                        <Button variant="quiet" onClick={() => setConfirmOpen(true)}>
                            Cancel subscription
                        </Button>
                    )}
                </Group>
            </Stack>

            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Cancel your subscription?"
                size="sm"
            >
                <Stack gap="md">
                    <p>
                        You keep {tier.name} until{' '}
                        {currentPeriodEnd ? formatLongDate(currentPeriodEnd) : 'the period end'} —
                        after that your account returns to the free plan. Finished tales stay in
                        your library.
                    </p>
                    <Group justify="flex-end" gap="sm">
                        <Button variant="quiet" onClick={() => setConfirmOpen(false)}>
                            Keep my plan
                        </Button>
                        <Button variant="primary" onClick={handleCancel} loading={isCanceling}>
                            Cancel subscription
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Card>
    );
}

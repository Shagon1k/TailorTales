'use client';

import { useTranslations } from 'next-intl';
import { Stack } from '@mantine/core';
import Card from '@/components/ui/Card/Card';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Progress from '@/components/ui/Progress/Progress';
import type { IUsageSummary } from '@/types/subscription.types';
import styles from './UsageBars.module.scss';

interface IUsageBarsProps {
    subscription: IUsageSummary;
}

interface IUsageRow {
    label: string;
    used: number;
    limit: number | null;
}

function percent(used: number, limit: number | null): number {
    if (limit === null || limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
}

export default function UsageBars({ subscription }: Readonly<IUsageBarsProps>): React.ReactElement {
    const t = useTranslations('account.subscription.usage');
    const { tier, pagesUsed, regenerationsUsed, childrenUsed } = subscription;

    const rows: IUsageRow[] = [
        { label: t('labels.pages'), used: pagesUsed, limit: tier.pagesPerMonth },
        {
            label: t('labels.regenerations'),
            used: regenerationsUsed,
            limit: tier.regenerationsPerMonth,
        },
        { label: t('labels.children'), used: childrenUsed, limit: tier.childrenLimit },
    ];

    return (
        <Card variant="gradient" size="md">
            <Stack gap="md">
                <CapsLabel>{t('eyebrow')}</CapsLabel>
                {rows.map((row) => (
                    <div key={row.label} className={styles['usage-bars__row']}>
                        <div className={styles['usage-bars__meta']}>
                            <span className={styles['usage-bars__label']}>{row.label}</span>
                            <span className={styles['usage-bars__count']}>
                                {row.used} / {row.limit === null ? '∞' : row.limit}
                            </span>
                        </div>
                        <Progress
                            size="md"
                            value={percent(row.used, row.limit)}
                            aria-label={t('ariaLabel', { label: row.label })}
                        />
                    </div>
                ))}
            </Stack>
        </Card>
    );
}

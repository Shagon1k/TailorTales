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
    const { tier, pagesUsed, regenerationsUsed, childrenUsed } = subscription;

    const rows: IUsageRow[] = [
        { label: 'Pages painted', used: pagesUsed, limit: tier.pagesPerMonth },
        {
            label: 'Regenerations',
            used: regenerationsUsed,
            limit: tier.regenerationsPerMonth,
        },
        { label: 'Children profiles', used: childrenUsed, limit: tier.childrenLimit },
    ];

    return (
        <Card variant="default" size="md">
            <Stack gap="md">
                <CapsLabel>This cycle</CapsLabel>
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
                            aria-label={`${row.label} usage`}
                        />
                    </div>
                ))}
            </Stack>
        </Card>
    );
}

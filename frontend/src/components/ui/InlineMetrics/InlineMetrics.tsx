import clsx from 'clsx';
import styles from './InlineMetrics.module.scss';

export interface IInlineMetricItem {
    id: string;
    value: React.ReactNode;
    label: React.ReactNode;
}

export type TInlineMetricsAlign = 'start' | 'center';

export interface IInlineMetricsProps {
    items: readonly IInlineMetricItem[];
    ariaLabel?: string;
    align?: TInlineMetricsAlign;
}

export default function InlineMetrics({
    items,
    ariaLabel,
    align = 'start',
}: Readonly<IInlineMetricsProps>): React.ReactElement {
    return (
        <ul
            className={clsx(styles['inline-metrics'], align === 'center' && styles['m-center'])}
            aria-label={ariaLabel}
        >
            {items.map((item) => (
                <li key={item.id} className={styles['inline-metrics__item']}>
                    <span className={styles['inline-metrics__value']}>{item.value}</span>
                    <span className={styles['inline-metrics__label']}> {item.label}</span>
                </li>
            ))}
        </ul>
    );
}

import clsx from 'clsx';
import styles from './StatCard.module.scss';

export type TStatCardTone = 'default' | 'positive' | 'negative';

export interface IStatCardProps {
    /** The metric value — large display number. */
    value: React.ReactNode;
    /** All-caps label above the value. */
    label: string;
    /** Delta / context line below the value. */
    info?: React.ReactNode;
    tone?: TStatCardTone;
}

export default function StatCard({
    value,
    label,
    info,
    tone = 'default',
}: Readonly<IStatCardProps>): React.ReactElement {
    return (
        <div className={clsx(styles['stat-card'], tone !== 'default' && styles[`m-${tone}`])}>
            <span className={styles['stat-card__label']}>{label}</span>
            <span className={styles['stat-card__value']}>{value}</span>
            {info && <p className={styles['stat-card__info']}>{info}</p>}
        </div>
    );
}

import type { ILogEntry } from '../../hooks/useGenerationStream';
import styles from './WorkshopLog.module.scss';

export interface IWorkshopLogProps {
    entries: readonly ILogEntry[];
    isLive: boolean;
}

export default function WorkshopLog({
    entries,
    isLive,
}: Readonly<IWorkshopLogProps>): React.ReactElement {
    return (
        <div className={styles.log}>
            <div className={styles.log__header}>
                <span>The workshop log</span>
                {isLive && <span className={styles.log__live}>● LIVE</span>}
            </div>
            <div className={styles.log__entries}>
                {entries.map((entry) => (
                    <div key={entry.id} className={styles.log__entry}>
                        <span className={styles.log__time}>{entry.time}</span>
                        <span>{entry.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

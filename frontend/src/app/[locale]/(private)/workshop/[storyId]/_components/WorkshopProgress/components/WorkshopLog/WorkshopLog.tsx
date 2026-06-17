'use client';

import { useTranslations } from 'next-intl';
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
    const t = useTranslations('workshopProgress.log');

    return (
        <div className={styles.log}>
            <div className={styles.log__header}>
                <span>{t('header')}</span>
                {isLive && <span className={styles.log__live}>{t('live')}</span>}
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

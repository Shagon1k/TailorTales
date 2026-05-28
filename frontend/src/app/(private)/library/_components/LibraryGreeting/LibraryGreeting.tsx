'use client';

import { useState } from 'react';
import { formatDateLine, getPeriod, getPeriodLabel } from './utils/greeting.utils';
import styles from './LibraryGreeting.module.scss';

export interface ILibraryGreetingProps {
    userName: string | null;
    storyCount: number;
}

export default function LibraryGreeting({
    userName,
    storyCount,
}: Readonly<ILibraryGreetingProps>): React.ReactElement {
    const [now] = useState(() => new Date());
    const period = getPeriod(now.getHours());
    const periodLabel = getPeriodLabel(period);
    const dateLine = formatDateLine(now, period);

    return (
        <section className={styles.greeting} aria-label="Library greeting">
            <div className={styles.greeting__left}>
                <p className={styles.greeting__eyebrow}>{dateLine}</p>

                <h1 className={styles.greeting__heading}>
                    Good {periodLabel}
                    {userName ? (
                        <>
                            , <span className={styles['greeting__name']}>{userName}</span>.
                        </>
                    ) : (
                        '.'
                    )}
                </h1>

                {/* dl: dt first in DOM for screen-reader order; column-reverse shows value on top visually */}
                <dl className={styles.greeting__stats}>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>tales in library</dt>
                        <dd className={styles['greeting__stat-value']}>{storyCount}</dd>
                    </div>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>pages this month</dt>
                        <dd className={styles['greeting__stat-value']}>--</dd>
                    </div>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>pages left</dt>
                        <dd className={styles['greeting__stat-value']}>--</dd>
                    </div>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>regenerations used</dt>
                        <dd className={styles['greeting__stat-value']}>--</dd>
                    </div>
                </dl>
            </div>
        </section>
    );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSubscription } from '@/hooks/subscription';
import { formatDateLine, getPeriod } from './utils/greeting.utils';
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
    const { data: subscription } = useSubscription();
    const t = useTranslations('library');
    const pagesThisCycle = subscription?.pagesUsed ?? '--';
    const pagesLeft = subscription
        ? Math.max(subscription.tier.pagesPerMonth - subscription.pagesUsed, 0)
        : '--';
    const regenerationsUsed = subscription?.regenerationsUsed ?? '--';
    const period = getPeriod(now.getHours());
    const dateLine = formatDateLine(now, period);

    const greetingText =
        period === 'morning'
            ? t('greeting.morning')
            : period === 'afternoon'
              ? t('greeting.afternoon')
              : t('greeting.evening');

    return (
        <section className={styles.greeting} aria-label="Library greeting">
            <div className={styles.greeting__left}>
                <p className={styles.greeting__eyebrow}>{dateLine}</p>

                <h1 className={styles.greeting__heading}>
                    {greetingText}
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
                        <dt className={styles['greeting__stat-label']}>
                            {t('greeting.stat.talesCount')}
                        </dt>
                        <dd className={styles['greeting__stat-value']}>{storyCount}</dd>
                    </div>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>
                            {t('greeting.stat.pagesThisCycle')}
                        </dt>
                        <dd className={styles['greeting__stat-value']}>{pagesThisCycle}</dd>
                    </div>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>
                            {t('greeting.stat.pagesLeft')}
                        </dt>
                        <dd className={styles['greeting__stat-value']}>{pagesLeft}</dd>
                    </div>
                    <div className={styles.greeting__stat}>
                        <dt className={styles['greeting__stat-label']}>
                            {t('greeting.stat.regenerationsUsed')}
                        </dt>
                        <dd className={styles['greeting__stat-value']}>{regenerationsUsed}</dd>
                    </div>
                </dl>
            </div>
        </section>
    );
}

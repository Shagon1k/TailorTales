import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import InlineMetrics from '@/components/ui/InlineMetrics/InlineMetrics';
import Tag from '@/components/ui/Tag/Tag';
import type { IChild } from '@/types/child.types';
import type { IStorySummary } from '@/types/story.types';
import { getAge, getRelativeTime } from '@/utils/date.utils';
import styles from './ReaderCard.module.scss';

export interface IReaderCardProps {
    child: IChild;
    stories: IStorySummary[];
}

export default async function ReaderCard({
    child,
    stories,
}: Readonly<IReaderCardProps>): Promise<React.ReactElement> {
    const t = await getTranslations('library.readerCard');
    const newTaleLabel = t('newTaleButton').replace(/^\+\s*/, '');
    const childStories = stories.filter((s) => s.childId === child.id);
    const lastStory = childStories.toSorted(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    return (
        <article
            className={styles['reader-card']}
            aria-label={t('ariaLabel', { childName: child.name })}
        >
            <div className={styles['reader-card__top']}>
                <div className={styles['reader-card__info']}>
                    <p className={styles['reader-card__name-row']}>
                        <span className={styles['reader-card__name']}>{child.name}</span>
                        <span className={styles['reader-card__age']}>
                            , {getAge(child.birthdate)}
                        </span>
                    </p>
                    {lastStory ? (
                        <p className={styles['reader-card__last-tale']}>
                            {t('lastTale', { relativeTime: getRelativeTime(lastStory.createdAt) })}
                        </p>
                    ) : (
                        <p className={styles['reader-card__last-tale']}>{t('noTales')}</p>
                    )}
                    {child.interests.length > 0 && (
                        <div className={styles['reader-card__interests-wrap']}>
                            <p className={styles['reader-card__interests-label']}>{t('loves')}</p>
                            <div className={styles['reader-card__interests']}>
                                {child.interests.map((interest) => (
                                    <Tag key={interest} variant="filled">
                                        {interest}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles['reader-card__footer']}>
                <Link
                    href={`/workshop?childId=${child.id}`}
                    className={styles['reader-card__new-tale']}
                >
                    <span className={styles['reader-card__new-tale-icon']} aria-hidden="true">
                        <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M6 2.5v7M2.5 6h7"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                    <span>{newTaleLabel}</span>
                </Link>
                <InlineMetrics
                    items={[
                        {
                            id: 'tales',
                            value: childStories.length,
                            label: t('taleCountMetricLabel', { count: childStories.length }),
                        },
                    ]}
                />
            </div>
        </article>
    );
}

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Avatar from '@/components/ui/Avatar/Avatar';
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
                <Avatar size="lg" name={child.name} />
                <div className={styles['reader-card__info']}>
                    <p className={styles['reader-card__name']}>
                        {child.name} · {getAge(child.birthdate)}
                    </p>
                    {lastStory ? (
                        <p className={styles['reader-card__last-tale']}>
                            {t('lastTale', { relativeTime: getRelativeTime(lastStory.createdAt) })}
                        </p>
                    ) : (
                        <p className={styles['reader-card__last-tale']}>{t('noTales')}</p>
                    )}
                    {child.interests.length > 0 && (
                        <p className={styles['reader-card__interests']}>
                            {t('loves')} {child.interests.join(', ')}
                        </p>
                    )}
                </div>
            </div>

            <div className={styles['reader-card__footer']}>
                <Link
                    href={`/workshop?childId=${child.id}`}
                    className={styles['reader-card__new-tale']}
                >
                    {t('newTaleButton')}
                </Link>
                <span className={styles['reader-card__count']}>
                    {t('taleCount', { count: childStories.length })}
                </span>
            </div>
        </article>
    );
}

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar/Avatar';
import type { IChild } from '@/types/child.types';
import type { IStorySummary } from '@/types/story.types';
import { getAge, getRelativeTime } from '@/utils/date.utils';
import styles from './ReaderCard.module.scss';

export interface IReaderCardProps {
    child: IChild;
    stories: IStorySummary[];
}

export default function ReaderCard({
    child,
    stories,
}: Readonly<IReaderCardProps>): React.ReactElement {
    const childStories = stories.filter((s) => s.childId === child.id);
    const lastStory = childStories.toSorted(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    return (
        <article className={styles['reader-card']} aria-label={`${child.name}'s reader card`}>
            <div className={styles['reader-card__top']}>
                <Avatar size="lg" name={child.name} />
                <div className={styles['reader-card__info']}>
                    <p className={styles['reader-card__name']}>
                        {child.name} · {getAge(child.birthdate)}
                    </p>
                    {lastStory ? (
                        <p className={styles['reader-card__last-tale']}>
                            last tale {getRelativeTime(lastStory.createdAt)}
                        </p>
                    ) : (
                        <p className={styles['reader-card__last-tale']}>no tales yet</p>
                    )}
                    {child.interests.length > 0 && (
                        <p className={styles['reader-card__interests']}>
                            loves: {child.interests.join(', ')}
                        </p>
                    )}
                </div>
            </div>

            <div className={styles['reader-card__footer']}>
                <Link
                    href={`/workshop?childId=${child.id}`}
                    className={styles['reader-card__new-tale']}
                >
                    + New tale
                </Link>
                <span className={styles['reader-card__count']}>
                    {childStories.length} {childStories.length === 1 ? 'tale' : 'tales'}
                </span>
            </div>
        </article>
    );
}

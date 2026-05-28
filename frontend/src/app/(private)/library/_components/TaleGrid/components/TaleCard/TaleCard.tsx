import Link from 'next/link';
import Image from 'next/image';
import { getAge } from '@/utils/date.utils';
import type { IStorySummary } from '@/types/story.types';
import styles from './TaleCard.module.scss';

/** Stable cover color derived from story id — consistent across re-renders. */
function getCoverColor(id: string): string {
    const palette = [
        'var(--color-ember)',
        'var(--color-fox)',
        'var(--color-plum)',
        'var(--color-gold)',
        'var(--color-ink-2)',
    ];
    const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return palette[hash % palette.length];
}

export interface ITaleCardProps {
    story: IStorySummary;
}

export default function TaleCard({ story }: Readonly<ITaleCardProps>): React.ReactElement {
    const displayTitle = story.title ?? `"${story.question}"`;
    const coverColor = getCoverColor(story.id);
    const age = getAge(story.child.birthdate);

    return (
        <Link
            href={`/library/${story.id}`}
            className={styles['tale-card']}
            aria-label={displayTitle}
        >
            <div
                className={styles['tale-card__cover']}
                style={{ backgroundColor: coverColor }}
                aria-hidden="true"
            >
                {story.coverImageUrl ? (
                    <Image
                        src={story.coverImageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 480px) 33vw, 50vw"
                        className={styles['tale-card__cover-img']}
                    />
                ) : (
                    <p className={styles['tale-card__cover-title']}>{displayTitle}</p>
                )}
            </div>

            <div className={styles['tale-card__meta']}>
                <span>age {age}</span>
                <span>·</span>
                <span>{story.pageCount}pp</span>
                <span>·</span>
                <span>{story.type.toLowerCase()}</span>
            </div>
        </Link>
    );
}

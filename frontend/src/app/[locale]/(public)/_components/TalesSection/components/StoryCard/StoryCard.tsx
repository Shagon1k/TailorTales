import { getTranslations } from 'next-intl/server';
import clsx from 'clsx';
import Rating from '@/components/ui/Rating/Rating';
import styles from './StoryCard.module.scss';

export type TStoryCardTone = 'rose' | 'fox' | 'plum';

interface IStoryCardProps {
    quote: string;
    childName: string;
    age: number;
    pages: number;
    format?: 'book' | 'comic';
    rating: number;
    tone: TStoryCardTone;
}

export default async function StoryCard({
    quote,
    childName,
    age,
    pages,
    format = 'book',
    rating,
    tone,
}: Readonly<IStoryCardProps>): Promise<React.ReactElement> {
    const t = await getTranslations('home.tales');

    const meta =
        t('card.meta', { childName, age, pages }) +
        (format === 'comic' ? t('card.comicSuffix') : '');

    return (
        <article className={clsx(styles['story-card'], styles[`m-${tone}`])}>
            <div className={styles['story-card__panel']}>
                <div className={styles['story-card__hatch']} aria-hidden="true" />
                <span className={styles['story-card__star']} aria-hidden="true">
                    ✦
                </span>
                <blockquote className={styles['story-card__quote']}>
                    &ldquo;{quote}&rdquo;
                </blockquote>
            </div>
            <footer className={styles['story-card__footer']}>
                <p className={styles['story-card__meta']}>{meta}</p>
                <Rating value={rating} readOnly />
            </footer>
        </article>
    );
}

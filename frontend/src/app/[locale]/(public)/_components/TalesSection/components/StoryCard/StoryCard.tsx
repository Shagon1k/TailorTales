'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import Rating from '@/components/ui/Rating/Rating';
import Button from '@/components/ui/Button/Button';
import Link from '@/components/ui/Link/Link';
import Modal from '@/components/ui/Modal/Modal';
import { LANGUAGES } from '@/constants/languages';
import type { IStoryGenre, IWritingStyle } from '@/types/story.types';
import styles from './StoryCard.module.scss';

export type TStoryCardTone = 'rose' | 'fox' | 'plum';

interface IStoryCardProps {
    title: string | null;
    quote: string;
    age: number;
    pages: number;
    language: 'EN' | 'RU' | 'DE';
    genre: IStoryGenre | null;
    writingStyle: IWritingStyle | null;
    artStyleName: string;
    hasCharacter: boolean;
    pdfUrl: string | null;
    format?: 'book' | 'comic';
    rating: number;
    tone: TStoryCardTone;
}

const GENRE_KEYS: Record<IStoryGenre, 'fairyTale' | 'bedtime' | 'educational' | 'adventure'> = {
    FAIRY_TALE: 'fairyTale',
    BEDTIME: 'bedtime',
    EDUCATIONAL: 'educational',
    ADVENTURE: 'adventure',
};

const WRITING_STYLE_KEYS: Record<IWritingStyle, 'simple' | 'poetic' | 'imaginative'> = {
    SIMPLE: 'simple',
    POETIC: 'poetic',
    IMAGINATIVE: 'imaginative',
};

export default function StoryCard({
    title,
    quote,
    age,
    pages,
    language,
    genre,
    writingStyle,
    artStyleName,
    hasCharacter,
    pdfUrl,
    format = 'book',
    rating,
    tone,
}: Readonly<IStoryCardProps>): React.ReactElement {
    const t = useTranslations('home.tales');
    const tStoryOptions = useTranslations('storyOptions');
    const [isOpen, setIsOpen] = useState(false);

    const meta = t('card.meta', { age, pages }) + (format === 'comic' ? t('card.comicSuffix') : '');
    const displayTitle = title ?? t('card.untitled');

    return (
        <>
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
                    <p className={styles['story-card__title']}>{displayTitle}</p>
                    <p className={styles['story-card__meta']}>{meta}</p>
                    <div className={styles['story-card__bottom']}>
                        <Rating value={rating} readOnly />
                        <Button variant="secondary" onClick={() => setIsOpen(true)}>
                            {t('card.previewButton')}
                        </Button>
                    </div>
                </footer>
            </article>

            <Modal opened={isOpen} onClose={() => setIsOpen(false)} title={displayTitle} size="lg">
                <div className={styles['story-card__modal']}>
                    <div className={styles['story-card__modal-header']}>
                        <p className={styles['story-card__modal-question']}>
                            &ldquo;{quote}&rdquo;
                        </p>
                        <Rating value={rating} readOnly />
                    </div>

                    <dl className={styles['story-card__details']}>
                        <div className={styles['story-card__detail']}>
                            <dt>{t('card.details.age')}</dt>
                            <dd>{t('card.details.ageValue', { age })}</dd>
                        </div>
                        <div className={styles['story-card__detail']}>
                            <dt>{t('card.details.format')}</dt>
                            <dd>
                                {format === 'comic'
                                    ? t('card.formats.comic')
                                    : t('card.formats.book')}
                            </dd>
                        </div>
                        <div className={styles['story-card__detail']}>
                            <dt>{t('card.details.pages')}</dt>
                            <dd>{pages}</dd>
                        </div>
                        <div className={styles['story-card__detail']}>
                            <dt>{t('card.details.language')}</dt>
                            <dd>{LANGUAGES[language].nativeName}</dd>
                        </div>
                        <div className={styles['story-card__detail']}>
                            <dt>{t('card.details.artStyle')}</dt>
                            <dd>{artStyleName}</dd>
                        </div>
                        <div className={styles['story-card__detail']}>
                            <dt>{t('card.details.hero')}</dt>
                            <dd>{hasCharacter ? t('card.hero.selected') : t('card.hero.none')}</dd>
                        </div>
                        {genre && (
                            <div className={styles['story-card__detail']}>
                                <dt>{t('card.details.genre')}</dt>
                                <dd>{tStoryOptions(`genres.${GENRE_KEYS[genre]}`)}</dd>
                            </div>
                        )}
                        {writingStyle && (
                            <div className={styles['story-card__detail']}>
                                <dt>{t('card.details.writingStyle')}</dt>
                                <dd>
                                    {tStoryOptions(
                                        `writingStyles.${WRITING_STYLE_KEYS[writingStyle]}`,
                                    )}
                                </dd>
                            </div>
                        )}
                    </dl>

                    {pdfUrl && (
                        <div className={styles['story-card__actions']}>
                            <Link href={pdfUrl} target="_blank" rel="noreferrer">
                                {t('card.previewPdfLink')}
                            </Link>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

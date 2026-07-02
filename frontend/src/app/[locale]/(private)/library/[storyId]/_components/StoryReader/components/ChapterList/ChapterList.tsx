'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import type { IPage } from '@/types/story.types';
import styles from './ChapterList.module.scss';

export interface IChapterListProps {
    pages: IPage[];
    activePageIndex: number;
    onPageClick: (pageIndex: number) => void;
}

export default function ChapterList({
    pages,
    activePageIndex,
    onPageClick,
}: Readonly<IChapterListProps>): React.ReactElement {
    const t = useTranslations('storyReader.chapters');
    const lastPageIndex = pages.length - 1;

    return (
        <nav className={styles['chapter-list']} aria-label={t('ariaLabel')}>
            <div className={styles['chapter-list__header']}>
                <CapsLabel variant="gold">{t('eyebrow')}</CapsLabel>
            </div>

            <ol className={styles['chapter-list__items']}>
                {pages.map((page) => {
                    const pageIdx = page.order - 1;
                    const isActive = pageIdx === activePageIndex;
                    const fallbackTitle =
                        pageIdx === 0
                            ? t('coverFallback')
                            : pageIdx === lastPageIndex
                              ? t('endingFallback')
                              : page.layout === 'book-full-image'
                                ? t('sceneFallback', { order: page.order })
                                : t('pageFallback', { order: page.order });

                    return (
                        <li key={page.id}>
                            <button
                                type="button"
                                onClick={() => onPageClick(pageIdx)}
                                aria-current={isActive ? 'true' : undefined}
                                className={clsx(styles['chapter-list__item'], {
                                    [styles['m-active']]: isActive,
                                })}
                            >
                                <span className={styles['chapter-list__num']}>
                                    {String(page.order).padStart(2, '0')}
                                </span>
                                <span className={styles['chapter-list__title']}>
                                    {page.chapterTitle ?? fallbackTitle}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

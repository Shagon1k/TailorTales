'use client';

import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import type { IPage } from '@/types/story.types';
import StoryPageIframe from './components/StoryPageIframe/StoryPageIframe';
import styles from './SpreadViewer.module.scss';

const PAGE_REGION_ID = 'story-page-region';

export interface ISpreadViewerProps {
    storyId: string;
    page: IPage;
    pageIndex: number;
    pageRefreshToken: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function SpreadViewer({
    storyId,
    page,
    pageIndex,
    pageRefreshToken,
    totalPages,
    onPrev,
    onNext,
}: Readonly<ISpreadViewerProps>): React.ReactElement {
    const t = useTranslations('storyReader.spread');
    const currentNumber = pageIndex + 1;
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === totalPages - 1;

    const chapterSuffix = page.chapterTitle ? ` — ${page.chapterTitle}` : '';
    const liveAnnouncement = `${t('pageAriaLabel', { current: currentNumber, total: totalPages })}${chapterSuffix}`;

    return (
        <section className={styles.viewer} aria-roledescription="book" aria-label={t('ariaLabel')}>
            <p className={styles['viewer__live']} aria-live="polite" aria-atomic="true">
                {liveAnnouncement}
            </p>

            <div
                id={PAGE_REGION_ID}
                className={styles.viewer__page}
                aria-label={t('pageAriaLabel', { current: currentNumber, total: totalPages })}
            >
                <StoryPageIframe
                    key={`${storyId}:${page.order}:${pageRefreshToken}`}
                    storyId={storyId}
                    pageOrder={page.order}
                    refreshToken={pageRefreshToken}
                />
            </div>

            <div className={styles.viewer__nav} role="group" aria-label={t('navGroupLabel')}>
                <Button
                    variant="secondary"
                    onClick={onPrev}
                    disabled={isFirst}
                    aria-controls={PAGE_REGION_ID}
                    aria-label={
                        isFirst
                            ? t('prevAriaFirst')
                            : t('prevAriaPage', { page: currentNumber - 1 })
                    }
                >
                    {t('prevButton')}
                </Button>

                <span className={styles['viewer__nav-counter']} aria-hidden="true">
                    {t('counter', { current: currentNumber, total: totalPages })}
                </span>

                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={isLast}
                    aria-controls={PAGE_REGION_ID}
                    aria-label={
                        isLast ? t('nextAriaLast') : t('nextAriaPage', { page: currentNumber + 1 })
                    }
                >
                    {t('nextButton')}
                </Button>
            </div>
        </section>
    );
}

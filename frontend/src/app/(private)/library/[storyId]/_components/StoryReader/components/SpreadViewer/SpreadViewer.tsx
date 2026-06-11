import Button from '@/components/ui/Button/Button';
import type { IPage } from '@/types/story.types';
import StoryPageIframe from './components/StoryPageIframe/StoryPageIframe';
import styles from './SpreadViewer.module.scss';

const PAGE_REGION_ID = 'story-page-region';

export interface ISpreadViewerProps {
    storyId: string;
    page: IPage;
    pageIndex: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
}

export default function SpreadViewer({
    storyId,
    page,
    pageIndex,
    totalPages,
    onPrev,
    onNext,
}: Readonly<ISpreadViewerProps>): React.ReactElement {
    const currentNumber = pageIndex + 1;
    const isFirst = pageIndex === 0;
    const isLast = pageIndex === totalPages - 1;

    const chapterSuffix = page.chapterTitle ? ` — ${page.chapterTitle}` : '';
    const liveAnnouncement = `Page ${currentNumber} of ${totalPages}${chapterSuffix}`;

    return (
        <section className={styles.viewer} aria-roledescription="book" aria-label="Story pages">
            <p className={styles['viewer__live']} aria-live="polite" aria-atomic="true">
                {liveAnnouncement}
            </p>

            <div
                id={PAGE_REGION_ID}
                className={styles.viewer__page}
                aria-label={`Page ${currentNumber} of ${totalPages}`}
            >
                <StoryPageIframe storyId={storyId} pageOrder={page.order} />
            </div>

            <div className={styles.viewer__nav} role="group" aria-label="Page navigation">
                <Button
                    variant="secondary"
                    onClick={onPrev}
                    disabled={isFirst}
                    aria-controls={PAGE_REGION_ID}
                    aria-label={
                        isFirst
                            ? 'Previous page (already at first)'
                            : `Go to page ${currentNumber - 1}`
                    }
                >
                    ← Previous
                </Button>

                <span className={styles['viewer__nav-counter']} aria-hidden="true">
                    {`${currentNumber} of ${totalPages}`}
                </span>

                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={isLast}
                    aria-controls={PAGE_REGION_ID}
                    aria-label={
                        isLast ? 'Next page (already at last)' : `Go to page ${currentNumber + 1}`
                    }
                >
                    Next →
                </Button>
            </div>
        </section>
    );
}

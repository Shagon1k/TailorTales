import Button from '@/components/ui/Button/Button';
import type { ISpread } from '../../utils/spread.utils';
import StoryPage from './components/StoryPage/StoryPage';
import styles from './SpreadViewer.module.scss';

// Stable ID — only one SpreadViewer exists per page, so a constant is safe.
const SPREAD_REGION_ID = 'story-spread-region';

export interface ISpreadViewerProps {
    spread: ISpread;
    totalSpreads: number;
    childName: string;
    onPrev: () => void;
    onNext: () => void;
}

export default function SpreadViewer({
    spread,
    totalSpreads,
    childName,
    onPrev,
    onNext,
}: Readonly<ISpreadViewerProps>): React.ReactElement {
    const currentNumber = spread.index + 1;
    const isFirst = spread.index === 0;
    const isLast = spread.index === totalSpreads - 1;

    const chapterSuffix = spread.left.chapterTitle ? ` — ${spread.left.chapterTitle}` : '';
    const liveAnnouncement = `Spread ${currentNumber} of ${totalSpreads}${chapterSuffix}`;

    return (
        <section
            className={styles.viewer}
            aria-roledescription="carousel"
            aria-label="Story spreads"
        >
            {/*
             * Visually hidden live region.
             * Announces the spread position + chapter title to screen readers on navigation.
             * Kept separate from the spread content so SR doesn't read out the full page text.
             */}
            <p className={styles['viewer__live']} aria-live="polite" aria-atomic="true">
                {liveAnnouncement}
            </p>

            {/*
             * id referenced by aria-controls on both nav buttons.
             * aria-label gives AT users context without re-reading the whole region.
             */}
            <div
                id={SPREAD_REGION_ID}
                className={styles.viewer__spread}
                aria-label={`Spread ${currentNumber} of ${totalSpreads}`}
            >
                <StoryPage page={spread.left} side="left" childName={childName} />
                {spread.right && (
                    <StoryPage page={spread.right} side="right" childName={childName} />
                )}
            </div>

            <div className={styles.viewer__nav} role="group" aria-label="Spread navigation">
                <Button
                    variant="secondary"
                    onClick={onPrev}
                    disabled={isFirst}
                    aria-controls={SPREAD_REGION_ID}
                    aria-label={
                        isFirst
                            ? 'Previous spread (already at first)'
                            : `Previous spread, spread ${currentNumber - 1} of ${totalSpreads}`
                    }
                >
                    ← Previous spread
                </Button>

                {/* aria-hidden: position is already conveyed by the live region and button labels */}
                <span className={styles['viewer__nav-counter']} aria-hidden="true">
                    {`spread ${currentNumber} of ${totalSpreads}`}
                </span>

                <Button
                    variant="primary"
                    onClick={onNext}
                    disabled={isLast}
                    aria-controls={SPREAD_REGION_ID}
                    aria-label={
                        isLast
                            ? 'Next spread (already at last)'
                            : `Next spread, spread ${currentNumber + 1} of ${totalSpreads}`
                    }
                >
                    Next spread →
                </Button>
            </div>
        </section>
    );
}

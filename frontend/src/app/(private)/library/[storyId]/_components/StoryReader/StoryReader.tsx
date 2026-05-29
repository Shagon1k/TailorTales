'use client';

import { useState } from 'react';
import type { IStoryDetail } from '@/types/story.types';
import { getSpreads } from './utils/spread.utils';
import ReaderHeader from './components/ReaderHeader/ReaderHeader';
import ChapterList from './components/ChapterList/ChapterList';
import SpreadViewer from './components/SpreadViewer/SpreadViewer';
import AboutPanel from './components/AboutPanel/AboutPanel';
import RatingPanel from './components/RatingPanel/RatingPanel';
import DetailsPanel from './components/DetailsPanel/DetailsPanel';
import styles from './StoryReader.module.scss';

export interface IStoryReaderProps {
    story: IStoryDetail;
}

export default function StoryReader({ story }: Readonly<IStoryReaderProps>): React.ReactElement {
    const spreads = getSpreads(story.pages);
    const [spreadIndex, setSpreadIndex] = useState(0);

    const currentSpread = spreads[spreadIndex];

    function handlePrev(): void {
        setSpreadIndex((i) => Math.max(0, i - 1));
    }

    function handleNext(): void {
        setSpreadIndex((i) => Math.min(spreads.length - 1, i + 1));
    }

    return (
        <div className={styles.reader}>
            <ReaderHeader story={story} />

            <div className={styles.reader__body}>
                <aside className={styles.reader__chapters} aria-label="Chapter navigation">
                    <ChapterList
                        pages={story.pages}
                        activeSpreadIndex={spreadIndex}
                        onChapterClick={setSpreadIndex}
                    />
                </aside>

                <main className={styles.reader__spread}>
                    {currentSpread && (
                        <SpreadViewer
                            spread={currentSpread}
                            totalSpreads={spreads.length}
                            childName={story.child.name}
                            onPrev={handlePrev}
                            onNext={handleNext}
                        />
                    )}
                </main>

                <aside className={styles.reader__panels}>
                    <AboutPanel />
                    <RatingPanel childName={story.child.name} />
                    <DetailsPanel story={story} />
                </aside>
            </div>
        </div>
    );
}

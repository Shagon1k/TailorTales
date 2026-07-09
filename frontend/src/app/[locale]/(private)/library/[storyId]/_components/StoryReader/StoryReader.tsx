'use client';

import { useState } from 'react';
import type { IStoryDetail } from '@/types/story.types';
import ReaderHeader from './components/ReaderHeader/ReaderHeader';
import ChapterList from './components/ChapterList/ChapterList';
import SpreadViewer from './components/SpreadViewer/SpreadViewer';
import RegenerationPanel from './components/RegenerationPanel/RegenerationPanel';
import RatingPanel from './components/RatingPanel/RatingPanel';
import DetailsPanel from './components/DetailsPanel/DetailsPanel';
import styles from './StoryReader.module.scss';

export interface IStoryReaderProps {
    story: IStoryDetail;
}

export default function StoryReader({ story }: Readonly<IStoryReaderProps>): React.ReactElement {
    const [pageIndex, setPageIndex] = useState(0);
    const [pageRefreshToken, setPageRefreshToken] = useState(0);
    const totalPages = story.pages.length;
    const currentPage = story.pages[pageIndex];

    function handlePrev(): void {
        setPageIndex((i) => Math.max(0, i - 1));
    }

    function handleNext(): void {
        setPageIndex((i) => Math.min(totalPages - 1, i + 1));
    }

    function handlePageRegenerated(): void {
        setPageRefreshToken((token) => token + 1);
    }

    return (
        <div className={styles.reader}>
            <ReaderHeader story={story} />

            <div className={styles.reader__body}>
                <aside className={styles.reader__chapters} aria-label="Chapter navigation">
                    <ChapterList
                        pages={story.pages}
                        activePageIndex={pageIndex}
                        onPageClick={setPageIndex}
                    />
                </aside>

                <div className={styles['reader__mobile-chapters']}>
                    <ChapterList
                        pages={story.pages}
                        activePageIndex={pageIndex}
                        onPageClick={setPageIndex}
                        layout="rail"
                    />
                </div>

                <main className={styles.reader__spread}>
                    {currentPage && (
                        <SpreadViewer
                            storyId={story.id}
                            page={currentPage}
                            pageIndex={pageIndex}
                            pageRefreshToken={pageRefreshToken}
                            totalPages={totalPages}
                            onPrev={handlePrev}
                            onNext={handleNext}
                        />
                    )}
                </main>

                <aside className={styles.reader__panels}>
                    {currentPage && (
                        <RegenerationPanel
                            storyId={story.id}
                            page={currentPage}
                            onRegenerated={handlePageRegenerated}
                        />
                    )}
                    <RatingPanel
                        storyId={story.id}
                        childName={story.child.name}
                        initialRating={story.myRating}
                        initialIsPublic={story.isPublic}
                    />
                    <DetailsPanel story={story} />
                </aside>
            </div>
        </div>
    );
}

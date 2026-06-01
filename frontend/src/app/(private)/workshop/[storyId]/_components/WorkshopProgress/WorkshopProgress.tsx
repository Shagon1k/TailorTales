'use client';

import { getAge } from '@/utils/date.utils';
import type { IStoryDetail } from '@/types/story.types';
import ProgressHero from './components/ProgressHero/ProgressHero';
import StageRow from './components/StageRow/StageRow';
import PagesGrid from './components/PagesGrid/PagesGrid';
import WorkshopLog from './components/WorkshopLog/WorkshopLog';
import SafetyBanner from './components/SafetyBanner/SafetyBanner';
import { useGenerationStream } from './hooks/useGenerationStream';
import { stageToStepIndex } from './utils/stage.utils';
import styles from './WorkshopProgress.module.scss';

export interface IWorkshopProgressProps {
    story: IStoryDetail;
}

export default function WorkshopProgress({
    story,
}: Readonly<IWorkshopProgressProps>): React.ReactElement {
    const { snapshot, completedPageOrders, activePageOrder, log, isCompleted, isFailed } =
        useGenerationStream(story.id, story.pageCount);

    const currentStepIndex = stageToStepIndex(snapshot?.stage ?? null);
    const age = getAge(story.child.birthdate);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <p className={styles.header__eyebrow}>· IN THE WORKSHOP ·</p>
                <h1 className={styles.header__question}>&ldquo;{story.question}&rdquo;</h1>
                <p className={styles.header__meta}>
                    for {story.child.name} · age {age} · {story.pageCount}-page book ·{' '}
                    {story.artStyle.name.toLowerCase()} style
                </p>
            </div>

            <ProgressHero
                completedPages={completedPageOrders.size}
                totalPages={story.pageCount}
                stage={snapshot?.stage ?? null}
                isCompleted={isCompleted}
                isFailed={isFailed}
            />

            <StageRow currentStepIndex={currentStepIndex} isCompleted={isCompleted} />

            <div className={styles.content}>
                <PagesGrid
                    totalPages={story.pageCount}
                    completedPageOrders={completedPageOrders}
                    activePageOrder={activePageOrder}
                />
                <WorkshopLog entries={log} isLive={!isCompleted && !isFailed} />
            </div>

            {!isCompleted && !isFailed && <SafetyBanner childName={story.child.name} />}
        </div>
    );
}

import type { IPage } from '@/types/story.types';
import styles from './StoryPage.module.scss';

export interface IStoryPageProps {
    page: IPage;
    side: 'left' | 'right';
    childName: string;
}

export default function StoryPage({
    page,
    side,
    childName,
}: Readonly<IStoryPageProps>): React.ReactElement {
    const illustration = page.illustrations[0] ?? null;

    if (side === 'right') {
        return (
            <div className={styles['story-page']} aria-label={`Page ${page.order} illustration`}>
                {illustration?.url ? (
                    <img
                        src={illustration.url}
                        alt={`Illustration for page ${page.order}`}
                        className={styles['story-page__illustration']}
                    />
                ) : (
                    <div className={styles['story-page__placeholder']} aria-hidden="true">
                        <p className={styles['story-page__placeholder-label']}>ILLUSTRATION</p>
                        {page.chapterTitle && (
                            <p className={styles['story-page__placeholder-caption']}>
                                {page.chapterTitle}
                            </p>
                        )}
                        <p className={styles['story-page__painted-by']}>painted by the workshop</p>
                    </div>
                )}
                {/* Page number lives on the right (illustration) side — matches design */}
                <p className={styles['story-page__number']}>{`PAGE · ${page.order}`}</p>
            </div>
        );
    }

    return (
        <div className={styles['story-page']} aria-label={`Page ${page.order}`}>
            {page.chapterTitle && (
                <p className={styles['story-page__chapter']}>{page.chapterTitle}</p>
            )}
            <div className={styles['story-page__body']}>
                {page.text ?? <p className={styles['story-page__text']}>{page.text}</p>}
            </div>
            <p className={styles['story-page__footer']}>{`TailorTales · for ${childName}`}</p>
        </div>
    );
}

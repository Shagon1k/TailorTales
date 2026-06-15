import clsx from 'clsx';
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
    return (
        <nav className={styles['chapter-list']} aria-label="Chapters">
            <div className={styles['chapter-list__header']}>
                <CapsLabel>· Chapters ·</CapsLabel>
            </div>

            <ol className={styles['chapter-list__items']}>
                {pages.map((page) => {
                    const pageIdx = page.order - 1;
                    const isActive = pageIdx === activePageIndex;

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
                                    {page.chapterTitle ?? `Page ${page.order}`}
                                </span>
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

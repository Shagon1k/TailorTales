'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button/Button';
import { getAge, getRelativeTime } from '@/utils/date.utils';
import type { IStoryDetail } from '@/types/story.types';
import styles from './ReaderHeader.module.scss';

export interface IReaderHeaderProps {
    story: IStoryDetail;
}

export default function ReaderHeader({ story }: Readonly<IReaderHeaderProps>): React.ReactElement {
    const t = useTranslations('storyReader.header');
    const age = getAge(story.child.birthdate);
    const formatLabel = story.type === 'BOOK' ? t('format.book') : t('format.comic');
    const finishedLabel = `finished ${getRelativeTime(story.updatedAt)}`;

    return (
        <header className={styles.header}>
            <nav className={styles.header__breadcrumb} aria-label={t('breadcrumb.ariaLabel')}>
                <ol className={styles['header__breadcrumb-list']}>
                    <li>
                        <Link href="/library" className={styles['header__breadcrumb-link']}>
                            {t('breadcrumb.library')}
                        </Link>
                    </li>
                    <li aria-hidden="true" className={styles['header__breadcrumb-sep']}>
                        /
                    </li>
                    <li>
                        <span className={styles['header__breadcrumb-link']}>
                            {t('breadcrumb.for', { childName: story.child.name })}
                        </span>
                    </li>
                    <li aria-hidden="true" className={styles['header__breadcrumb-sep']}>
                        /
                    </li>
                    <li aria-current="page" className={styles['header__breadcrumb-current']}>
                        {story.title ?? story.question}
                    </li>
                </ol>
            </nav>

            <div className={styles.header__row}>
                <h1 className={styles.header__title}>{story.title ?? `"${story.question}"`}</h1>

                <div className={styles.header__download}>
                    {story.pdfUrl ? (
                        <Button
                            variant="primary"
                            component="a"
                            href={story.pdfUrl}
                            download={`${story.title ?? 'story'}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('downloadButton')}
                        </Button>
                    ) : (
                        <Button variant="primary" disabled>
                            {t('downloadButton')}
                        </Button>
                    )}
                </div>
            </div>

            <p className={styles.header__meta}>
                {t('meta.prefix')}
                <strong>{story.child.name}</strong>
                {t('meta.suffix', { age, pageCount: story.pageCount, formatLabel, finishedLabel })}
            </p>
        </header>
    );
}

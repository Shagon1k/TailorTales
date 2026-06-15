import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button/Button';
import { getAge, getRelativeTime } from '@/utils/date.utils';
import type { IStoryDetail } from '@/types/story.types';
import styles from './ReaderHeader.module.scss';

const FORMAT_LABELS: Record<string, string> = {
    BOOK: 'storybook',
    COMIC: 'comic',
};

export interface IReaderHeaderProps {
    story: IStoryDetail;
}

export default function ReaderHeader({ story }: Readonly<IReaderHeaderProps>): React.ReactElement {
    const age = getAge(story.child.birthdate);
    const formatLabel = FORMAT_LABELS[story.type] ?? story.type.toLowerCase();
    const finishedLabel = `finished ${getRelativeTime(story.updatedAt)}`;

    return (
        <header className={styles.header}>
            <nav className={styles.header__breadcrumb} aria-label="Breadcrumb">
                <ol className={styles['header__breadcrumb-list']}>
                    <li>
                        <Link href="/library" className={styles['header__breadcrumb-link']}>
                            Library
                        </Link>
                    </li>
                    <li aria-hidden="true" className={styles['header__breadcrumb-sep']}>
                        /
                    </li>
                    <li>
                        <span className={styles['header__breadcrumb-link']}>
                            {`For ${story.child.name}`}
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

                <div className={styles.header__actions}>
                    <Button variant="secondary" disabled>
                        + Share with family
                    </Button>
                    {story.pdfUrl ? (
                        <Button
                            variant="primary"
                            component="a"
                            href={story.pdfUrl}
                            download={`${story.title ?? 'story'}.pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ↓ Download PDF
                        </Button>
                    ) : (
                        <Button variant="primary" disabled>
                            ↓ Download PDF
                        </Button>
                    )}
                </div>
            </div>

            <p className={styles.header__meta}>
                {`a tale for `}
                <strong>{story.child.name}</strong>
                {`, age ${age} · ${story.pageCount} pages · ${formatLabel} · ${finishedLabel}`}
            </p>
        </header>
    );
}

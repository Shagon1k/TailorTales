import clsx from 'clsx';
import Button from '@/components/ui/Button/Button';
import type { IAdminStorySummary } from '@/types/admin.types';
import type { IStoryStatus } from '@/types/story.types';
import styles from './StoriesTable.module.scss';

export interface IStoriesTableProps {
    stories: IAdminStorySummary[];
    onDelete: (story: IAdminStorySummary) => void;
    isMutating: boolean;
}

const STATUS_LABEL: Record<IStoryStatus, string> = {
    DRAFT: 'Draft',
    QUEUED: 'Queued',
    GENERATING: 'Generating',
    COMPLETED: 'Completed',
    FAILED: 'Failed',
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function StoriesTable({
    stories,
    onDelete,
    isMutating,
}: Readonly<IStoriesTableProps>): React.ReactElement {
    return (
        <table className={styles.table}>
            <thead>
                <tr>
                    <th className={styles.table__th}>Story</th>
                    <th className={styles.table__th}>Status</th>
                    <th className={styles.table__th}>Owner</th>
                    <th className={styles.table__th}>Child</th>
                    <th className={styles.table__th}>Pages</th>
                    <th className={styles.table__th}>Created</th>
                    <th className={styles.table__th}>
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {stories.map((story) => (
                    <tr key={story.id} className={styles.table__row}>
                        <td className={styles.table__td}>
                            <div className={styles.table__story}>
                                {story.coverImageUrl ? (
                                    <img
                                        src={story.coverImageUrl}
                                        alt=""
                                        className={styles.table__cover}
                                    />
                                ) : (
                                    <div className={styles['table__cover-placeholder']} />
                                )}
                                <div>
                                    <span className={styles.table__title}>
                                        {story.title ?? story.question}
                                    </span>
                                    <span className={styles.table__meta}>
                                        {story.type} · {story.artStyleName}
                                    </span>
                                </div>
                            </div>
                        </td>
                        <td className={styles.table__td}>
                            <span
                                className={clsx(
                                    styles.table__status,
                                    styles[`m-${story.status.toLowerCase()}`],
                                )}
                            >
                                {STATUS_LABEL[story.status]}
                            </span>
                        </td>
                        <td className={styles.table__td}>
                            <span className={styles.table__name}>{story.owner.name}</span>
                            <span className={styles.table__email}>{story.owner.email}</span>
                        </td>
                        <td className={styles.table__td}>{story.childName}</td>
                        <td className={styles.table__td}>{story.pageCount}</td>
                        <td className={styles.table__td}>{formatDate(story.createdAt)}</td>
                        <td className={styles.table__td}>
                            <Button
                                variant="quiet"
                                disabled={isMutating}
                                onClick={() => onDelete(story)}
                            >
                                Delete
                            </Button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

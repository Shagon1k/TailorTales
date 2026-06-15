import clsx from 'clsx';
import Button from '@/components/ui/Button/Button';
import Table from '@/components/ui/Table/Table';
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
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>Story</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Owner</Table.HeaderCell>
                    <Table.HeaderCell>Child</Table.HeaderCell>
                    <Table.HeaderCell>Pages</Table.HeaderCell>
                    <Table.HeaderCell>Created</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">Actions</span>
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {stories.map((story) => (
                    <Table.Row key={story.id}>
                        <Table.Cell>
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
                        </Table.Cell>
                        <Table.Cell>
                            <span
                                className={clsx(
                                    styles.table__status,
                                    styles[`m-${story.status.toLowerCase()}`],
                                )}
                            >
                                {STATUS_LABEL[story.status]}
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            <span className={styles.table__name}>{story.owner.name}</span>
                            <span className={styles.table__email}>{story.owner.email}</span>
                        </Table.Cell>
                        <Table.Cell>{story.childName}</Table.Cell>
                        <Table.Cell>{story.pageCount}</Table.Cell>
                        <Table.Cell>{formatDate(story.createdAt)}</Table.Cell>
                        <Table.Cell>
                            <Button
                                variant="quiet"
                                disabled={isMutating}
                                onClick={() => onDelete(story)}
                            >
                                Delete
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}

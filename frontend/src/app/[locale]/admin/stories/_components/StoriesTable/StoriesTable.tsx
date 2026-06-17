'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations('admin.stories.table');

    const statusLabel: Record<IStoryStatus, string> = {
        DRAFT: t('statuses.pending'),
        QUEUED: t('statuses.pending'),
        GENERATING: t('statuses.generating'),
        COMPLETED: t('statuses.ready'),
        FAILED: t('statuses.failed'),
    };

    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>{t('story')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('status')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('owner')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('child')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('pages')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('created')}</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">{t('actions')}</span>
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
                                {statusLabel[story.status]}
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
                                {t('delete')}
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}

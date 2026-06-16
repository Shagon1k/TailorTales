'use client';

import { useTranslations } from 'next-intl';
import Table from '@/components/ui/Table/Table';
import type { IAdminStoryRating } from '@/types/admin.types';
import styles from './RatingsTable.module.scss';

export interface IRatingsTableProps {
    ratings: IAdminStoryRating[];
}

function renderStars(score: number): string {
    return '★'.repeat(score) + '☆'.repeat(5 - score);
}

export default function RatingsTable({
    ratings,
}: Readonly<IRatingsTableProps>): React.ReactElement {
    const t = useTranslations('admin.ratings.table');

    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>{t('user')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('story')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('score')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('comment')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('date')}</Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {ratings.map((rating) => (
                    <Table.Row key={rating.id}>
                        <Table.Cell>
                            <span className={styles.table__name}>{rating.user.name}</span>
                            <span className={styles.table__email}>{rating.user.email}</span>
                        </Table.Cell>
                        <Table.Cell>
                            <span className={styles.table__title}>
                                {rating.story.title ?? t('untitled')}
                            </span>
                            <span className={styles.table__question}>{rating.story.question}</span>
                        </Table.Cell>
                        <Table.Cell>
                            <span
                                className={styles.table__stars}
                                aria-label={t('scoreAriaLabel', { score: rating.score })}
                            >
                                {renderStars(rating.score)}
                            </span>
                        </Table.Cell>
                        <Table.Cell>
                            {rating.comment ? (
                                <span className={styles.table__comment}>{rating.comment}</span>
                            ) : (
                                <span className={styles['table__comment-empty']}>—</span>
                            )}
                        </Table.Cell>
                        <Table.Cell>
                            {new Date(rating.createdAt).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                            })}
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
}

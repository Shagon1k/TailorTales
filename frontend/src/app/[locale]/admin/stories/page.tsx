'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Loader from '@/components/ui/Loader/Loader';
import Modal from '@/components/ui/Modal/Modal';
import { useAdminStories, useDeleteStory } from '@/hooks/admin';
import type { IAdminStoriesFilter, IAdminStorySummary } from '@/types/admin.types';
import Pagination from '../_components/Pagination/Pagination';
import StoriesTable from './_components/StoriesTable/StoriesTable';
import styles from './page.module.scss';

export default function StoriesPage(): React.ReactElement {
    const t = useTranslations('admin.stories');
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchInput, 500);
    const [page, setPage] = useState(1);
    const [pendingDelete, setPendingDelete] = useState<IAdminStorySummary | null>(null);

    const filter: IAdminStoriesFilter = { search: debouncedSearch.trim() || undefined, page };
    const { data, isLoading, isFetching } = useAdminStories(filter);
    const { mutate: deleteStory, isPending: isDeleting } = useDeleteStory();

    function handleDelete(story: IAdminStorySummary): void {
        setPendingDelete(story);
    }

    function confirmDelete(): void {
        if (!pendingDelete) return;
        deleteStory(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
    }

    const storyLabel = pendingDelete?.title ?? pendingDelete?.question ?? '';

    return (
        <div className={styles.page}>
            <div className={styles.page__header}>
                <h2 className={styles.page__title}>{t('heading')}</h2>
                <div className={styles.page__search}>
                    <Input
                        placeholder={t('searchPlaceholder')}
                        value={searchInput}
                        onChange={(event) => {
                            setSearchInput(event.currentTarget.value);
                            setPage(1);
                        }}
                        aria-label={t('searchAriaLabel')}
                    />
                </div>
            </div>

            {isLoading || !data ? (
                <Loader label={t('loading')} />
            ) : data.items.length === 0 ? (
                <p className={styles.page__empty}>{t('empty')}</p>
            ) : (
                <>
                    <div
                        className={styles['page__table-wrap']}
                        data-fetching={isFetching}
                        aria-busy={isFetching}
                    >
                        <StoriesTable
                            stories={data.items}
                            onDelete={handleDelete}
                            isMutating={isDeleting}
                        />
                    </div>
                    <Pagination
                        page={data.page}
                        total={data.total}
                        pageSize={data.pageSize}
                        onPageChange={setPage}
                    />
                </>
            )}

            <Modal
                opened={pendingDelete !== null}
                onClose={() => setPendingDelete(null)}
                title={t('deleteModal.title')}
                size="sm"
            >
                <p className={styles.page__confirm}>
                    {t('deleteModal.body', { title: storyLabel })}
                </p>
                <div className={styles['page__confirm-actions']}>
                    <Button variant="quiet" onClick={() => setPendingDelete(null)}>
                        {t('deleteModal.cancel')}
                    </Button>
                    <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                        {t('deleteModal.confirm')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDebouncedValue } from '@mantine/hooks';
import Button from '@/components/ui/Button/Button';
import Input from '@/components/ui/Input/Input';
import Loader from '@/components/ui/Loader/Loader';
import Modal from '@/components/ui/Modal/Modal';
import { useCurrentUser } from '@/context/UserContext';
import { useAdminUsers, useChangeUserRole, useSetUserSuspension } from '@/hooks/admin';
import { isSuperAdmin } from '@/utils/role.utils';
import type { IAdminUserSummary, IAdminUsersFilter } from '@/types/admin.types';
import type { TUserRole } from '@/types/user.types';
import Pagination from '../_components/Pagination/Pagination';
import UsersTable from './_components/UsersTable/UsersTable';
import styles from './page.module.scss';

export default function UsersPage(): React.ReactElement {
    const t = useTranslations('admin.users');
    const { user } = useCurrentUser();
    const canChangeRoles = user ? isSuperAdmin(user.role) : false;

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch] = useDebouncedValue(searchInput, 500);
    const [page, setPage] = useState(1);
    const [pendingSuspend, setPendingSuspend] = useState<IAdminUserSummary | null>(null);

    const query: IAdminUsersFilter = { search: debouncedSearch.trim() || undefined, page };
    const { data, isLoading, isFetching } = useAdminUsers(query);
    const { mutate: changeRole, isPending: isChangingRole } = useChangeUserRole();
    const { mutate: setSuspension, isPending: isSuspending } = useSetUserSuspension();
    const isMutating = isChangingRole || isSuspending;

    function handleRoleChange(id: string, role: TUserRole): void {
        changeRole({ id, role });
    }

    function handleToggleSuspend(target: IAdminUserSummary): void {
        if (target.suspendedAt) {
            setSuspension({ id: target.id, suspended: false });
        } else {
            setPendingSuspend(target);
        }
    }

    function confirmSuspend(): void {
        if (!pendingSuspend) return;
        setSuspension(
            { id: pendingSuspend.id, suspended: true },
            { onSuccess: () => setPendingSuspend(null) },
        );
    }

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
                        <UsersTable
                            users={data.items}
                            currentUserId={user?.id ?? ''}
                            canChangeRoles={canChangeRoles}
                            onRoleChange={handleRoleChange}
                            onToggleSuspend={handleToggleSuspend}
                            isMutating={isMutating}
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
                opened={pendingSuspend !== null}
                onClose={() => setPendingSuspend(null)}
                title={t('suspendModal.title')}
                size="sm"
            >
                <p className={styles.page__confirm}>
                    {t('suspendModal.body', { name: pendingSuspend?.name ?? '' })}
                </p>
                <div className={styles['page__confirm-actions']}>
                    <Button variant="secondary" onClick={() => setPendingSuspend(null)}>
                        {t('suspendModal.cancel')}
                    </Button>
                    <Button onClick={confirmSuspend} disabled={isSuspending}>
                        {t('suspendModal.confirm')}
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button/Button';
import Select from '@/components/ui/Select/Select';
import Table from '@/components/ui/Table/Table';
import type { IAdminUserSummary } from '@/types/admin.types';
import type { TUserRole } from '@/types/user.types';
import styles from './UsersTable.module.scss';

export interface IUsersTableProps {
    users: IAdminUserSummary[];
    currentUserId: string;
    canChangeRoles: boolean;
    onRoleChange: (id: string, role: TUserRole) => void;
    onToggleSuspend: (user: IAdminUserSummary) => void;
    isMutating: boolean;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function UsersTable({
    users,
    currentUserId,
    canChangeRoles,
    onRoleChange,
    onToggleSuspend,
    isMutating,
}: Readonly<IUsersTableProps>): React.ReactElement {
    const t = useTranslations('admin.users.table');

    const roleOptions: { value: TUserRole; label: string }[] = [
        { value: 'USER', label: t('roles.user') },
        { value: 'ADMIN', label: t('roles.admin') },
        { value: 'SUPER_ADMIN', label: t('roles.superAdmin') },
    ];

    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>{t('user')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('role')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('tier')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('stories')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('joined')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('status')}</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">{t('actions')}</span>
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {users.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isSuspended = user.suspendedAt !== null;

                    return (
                        <Table.Row key={user.id}>
                            <Table.Cell>
                                <span className={styles.table__name}>{user.name}</span>
                                <span className={styles.table__email}>{user.email}</span>
                            </Table.Cell>
                            <Table.Cell>
                                {canChangeRoles ? (
                                    <Select
                                        data={roleOptions}
                                        value={user.role}
                                        onChange={(value) =>
                                            value && onRoleChange(user.id, value as TUserRole)
                                        }
                                        disabled={isSelf || isMutating}
                                        allowDeselect={false}
                                        aria-label={t('roleAriaLabel', { name: user.name })}
                                    />
                                ) : (
                                    <span className={styles.table__role}>{user.role}</span>
                                )}
                            </Table.Cell>
                            <Table.Cell>{user.subscriptionTier ?? '—'}</Table.Cell>
                            <Table.Cell>{user.storiesCount}</Table.Cell>
                            <Table.Cell>{formatDate(user.createdAt)}</Table.Cell>
                            <Table.Cell>
                                <span
                                    className={clsx(styles.table__status, {
                                        [styles['m-suspended']]: isSuspended,
                                    })}
                                >
                                    {isSuspended ? t('statusSuspended') : t('statusActive')}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <Button
                                    variant={isSuspended ? 'secondary' : 'quiet'}
                                    disabled={isSelf || isMutating}
                                    onClick={() => onToggleSuspend(user)}
                                >
                                    {isSuspended ? t('reinstate') : t('suspend')}
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table>
    );
}

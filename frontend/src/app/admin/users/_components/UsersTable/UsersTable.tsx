import clsx from 'clsx';
import Button from '@/components/ui/Button/Button';
import Select from '@/components/ui/Select/Select';
import Table from '@/components/ui/Table/Table';
import type { IAdminUserSummary } from '@/types/admin.types';
import type { TUserRole } from '@/types/user.types';
import styles from './UsersTable.module.scss';

const ROLE_OPTIONS: { value: TUserRole; label: string }[] = [
    { value: 'USER', label: 'User' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'SUPER_ADMIN', label: 'Super admin' },
];

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
    return (
        <Table>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>User</Table.HeaderCell>
                    <Table.HeaderCell>Role</Table.HeaderCell>
                    <Table.HeaderCell>Tier</Table.HeaderCell>
                    <Table.HeaderCell>Stories</Table.HeaderCell>
                    <Table.HeaderCell>Joined</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>
                        <span className="sr-only">Actions</span>
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
                                        data={ROLE_OPTIONS}
                                        value={user.role}
                                        onChange={(value) =>
                                            value && onRoleChange(user.id, value as TUserRole)
                                        }
                                        disabled={isSelf || isMutating}
                                        allowDeselect={false}
                                        aria-label={`Role for ${user.name}`}
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
                                    {isSuspended ? 'Suspended' : 'Active'}
                                </span>
                            </Table.Cell>
                            <Table.Cell>
                                <Button
                                    variant={isSuspended ? 'secondary' : 'quiet'}
                                    disabled={isSelf || isMutating}
                                    onClick={() => onToggleSuspend(user)}
                                >
                                    {isSuspended ? 'Reinstate' : 'Suspend'}
                                </Button>
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table>
    );
}

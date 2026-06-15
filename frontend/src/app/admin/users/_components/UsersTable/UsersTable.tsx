import clsx from 'clsx';
import Button from '@/components/ui/Button/Button';
import Select from '@/components/ui/Select/Select';
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
        <table className={styles.table}>
            <thead>
                <tr>
                    <th className={styles.table__th}>User</th>
                    <th className={styles.table__th}>Role</th>
                    <th className={styles.table__th}>Tier</th>
                    <th className={styles.table__th}>Stories</th>
                    <th className={styles.table__th}>Joined</th>
                    <th className={styles.table__th}>Status</th>
                    <th className={styles.table__th}>
                        <span className="sr-only">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {users.map((user) => {
                    const isSelf = user.id === currentUserId;
                    const isSuspended = user.suspendedAt !== null;

                    return (
                        <tr key={user.id} className={styles.table__row}>
                            <td className={styles.table__td}>
                                <span className={styles.table__name}>{user.name}</span>
                                <span className={styles.table__email}>{user.email}</span>
                            </td>
                            <td className={styles.table__td}>
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
                            </td>
                            <td className={styles.table__td}>{user.subscriptionTier ?? '—'}</td>
                            <td className={styles.table__td}>{user.storiesCount}</td>
                            <td className={styles.table__td}>{formatDate(user.createdAt)}</td>
                            <td className={styles.table__td}>
                                <span
                                    className={clsx(styles.table__status, {
                                        [styles['m-suspended']]: isSuspended,
                                    })}
                                >
                                    {isSuspended ? 'Suspended' : 'Active'}
                                </span>
                            </td>
                            <td className={styles.table__td}>
                                <Button
                                    variant={isSuspended ? 'secondary' : 'quiet'}
                                    disabled={isSelf || isMutating}
                                    onClick={() => onToggleSuspend(user)}
                                >
                                    {isSuspended ? 'Reinstate' : 'Suspend'}
                                </Button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

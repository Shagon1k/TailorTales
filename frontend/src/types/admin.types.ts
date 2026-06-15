import type { TUserRole } from '@/types/user.types';

/** Top-line dashboard counts. `mrrCents` is Monthly Recurring Revenue in euro cents. */
export interface IAdminStats {
    users: number;
    stories: number;
    activePaidSubscriptions: number;
    mrrCents: number;
}

/** A user row in the admin user table. */
export interface IAdminUserSummary {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: TUserRole;
    suspendedAt: string | null;
    createdAt: string;
    subscriptionTier: string | null;
    storiesCount: number;
}

/** One page of admin users plus the total count for pagination controls. */
export interface IAdminUserListPage {
    items: IAdminUserSummary[];
    total: number;
    page: number;
    pageSize: number;
}

export interface IAdminUsersFilter {
    search?: string;
    page: number;
}

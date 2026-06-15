import type { IStoryStatus, IStoryType } from '@/types/story.types';
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

/** A story row enriched with owner context for the admin moderation table. */
export interface IAdminStorySummary {
    id: string;
    title: string | null;
    question: string;
    type: IStoryType;
    status: IStoryStatus;
    isPublic: boolean;
    pageCount: number;
    createdAt: string;
    coverImageUrl: string | null;
    owner: { id: string; name: string; email: string };
    childName: string;
    artStyleName: string;
}

/** One page of admin stories plus the total count for pagination controls. */
export interface IAdminStoryListPage {
    items: IAdminStorySummary[];
    total: number;
    page: number;
    pageSize: number;
}

export interface IAdminStoriesFilter {
    search?: string;
    page: number;
}

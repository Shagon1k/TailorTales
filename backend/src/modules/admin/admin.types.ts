import type { Role } from '../../generated/prisma/client.js';

/** A user row enriched with subscription + story context for the admin user table. */
export interface IAdminUserSummary {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: Role;
    suspendedAt: Date | null;
    createdAt: Date;
    /** PricingTier name of the user's subscription, or null if they have none. */
    subscriptionTier: string | null;
    storiesCount: number;
}

/** One page of admin users plus the total count for pagination controls. */
export interface IAdminUserList {
    items: IAdminUserSummary[];
    total: number;
    page: number;
    pageSize: number;
}

/** Top-line counts for the admin dashboard. `mrrCents` is Monthly Recurring Revenue in euro cents. */
export interface IAdminStats {
    users: number;
    stories: number;
    activePaidSubscriptions: number;
    mrrCents: number;
}

import type { Rating } from '../../generated/prisma/client.js';

/** The current user's own rating, embedded in their story detail so the panel pre-fills. */
export interface IMyRating {
    score: number;
    comment: string | null;
}

/** A rating row enriched with story + author context for the admin feedback view. */
export interface IAdminRating extends Rating {
    story: { id: string; title: string | null; question: string; isPublic: boolean };
    user: { id: string; name: string; email: string };
}

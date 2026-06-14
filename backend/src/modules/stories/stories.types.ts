import type { ArtStyle, Child, Page, Story } from '../../generated/prisma/client.js';
import type { IMyRating } from '../ratings/ratings.types.js';

export interface IStoryConfig {
    allowedPageCounts: readonly number[];
    questionMinLength: number;
    questionMaxLength: number;
    questionSuggestions: readonly string[];
}

/** S3 keys are internal — clients never see raw bucket paths. */
type StoryWithoutKeys = Omit<Story, 'coverImageKey' | 'pdfKey'>;

export interface IStorySummary extends StoryWithoutKeys {
    child: Pick<Child, 'id' | 'name' | 'birthdate'>;
    artStyle: Pick<ArtStyle, 'id' | 'name' | 'slug' | 'thumbnailUrl'>;
    /** Pre-signed S3 URL valid for 1 hour. Null until generation completes (Phase 5). */
    coverImageUrl: string | null;
    /** The owner's rating score (1-5), or null if unrated. Only the owner can rate a story. */
    rating: number | null;
}

export interface IStoryDetail extends IStorySummary {
    pages: Page[];
    /** Pre-signed S3 URL valid for 1 hour. Null until generation completes (Phase 5). */
    pdfUrl: string | null;
    /** The current user's full rating, so the rating panel pre-fills. Null if unrated. */
    myRating: IMyRating | null;
}

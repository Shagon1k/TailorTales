import type { Child, Page, Story, StoryStatus, StoryType } from '../../generated/prisma/client.js';
import type { IMyRating } from '../ratings/ratings.types.js';

/** Art style as embedded in a story response — thumbnailKey signed into a URL. */
export interface IStoryArtStyle {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
}

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
    artStyle: IStoryArtStyle;
    /** Pre-signed S3 URL valid for 1 hour. Null until generation completes. */
    coverImageUrl: string | null;
    /** The owner's rating score (1-5), or null if unrated. Only the owner can rate a story. */
    rating: number | null;
}

/** Public-safe story showcase card — excludes child identity and includes only safe metadata. */
export interface IPublicStorySummary {
    id: string;
    type: StoryType;
    question: string;
    pageCount: number;
    language: Story['language'];
    genre: Story['genre'];
    writingStyle: Story['writingStyle'];
    title: string | null;
    rating: number;
    readerAge: number;
    hasCharacter: boolean;
    artStyle: IStoryArtStyle;
    coverImageUrl: string | null;
    pdfUrl: string | null;
}

export interface IStoryDetail extends IStorySummary {
    pages: Page[];
    /** Pre-signed S3 URL valid for 1 hour. Null until generation completes. */
    pdfUrl: string | null;
    /** The current user's full rating, so the rating panel pre-fills. Null if unrated. */
    myRating: IMyRating | null;
}

/** A story row enriched with owner context for the admin moderation table. */
export interface IAdminStorySummary {
    id: string;
    title: string | null;
    question: string;
    type: StoryType;
    status: StoryStatus;
    isPublic: boolean;
    pageCount: number;
    createdAt: Date;
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

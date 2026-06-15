export type IStoryType = 'BOOK' | 'COMIC';
export type IStoryStatus = 'DRAFT' | 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED';
export type ILanguage = 'EN' | 'RU' | 'DE';

/** Illustration entry on a Page. Structure is extended in Phase 5 (generation pipeline). */
export interface IIllustration {
    url: string;
    position?: string;
}

export interface IPage {
    id: string;
    storyId: string;
    order: number;
    chapterTitle: string | null;
    text: string | null;
    illustrations: IIllustration[];
    layout: string | null;
    illustrationPrompt: string | null;
}

export type IRegenerateWhat = 'text' | 'illustration' | 'both';

export interface IRegeneratePagePayload {
    what: IRegenerateWhat;
    /** Optional author note to guide the regeneration. */
    prompt?: string;
}

/** Embedded child snapshot returned inside story responses. */
export interface IStoryChild {
    id: string;
    name: string;
    birthdate: string;
}

/** Embedded art style snapshot returned inside story responses. */
export interface IStoryArtStyle {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
}

export interface IStorySummary {
    id: string;
    userId: string;
    childId: string;
    type: IStoryType;
    status: IStoryStatus;
    blueprintId: string | null;
    question: string;
    pageCount: number;
    artStyleId: string;
    language: ILanguage;
    title: string | null;
    styleAnchor: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    child: IStoryChild;
    artStyle: IStoryArtStyle;
    coverImageUrl: string | null;
    /** The owner's rating score (1-5), or null if unrated. Only the owner can rate a story. */
    rating: number | null;
}

/** The current user's own rating, embedded in their story detail so the panel pre-fills. */
export interface IMyRating {
    score: number;
    comment: string | null;
}

export interface IStoryDetail extends IStorySummary {
    pages: IPage[];
    pdfUrl: string | null;
    myRating: IMyRating | null;
}

export interface ISubmitRatingPayload {
    score: number;
    comment?: string;
    /** Opt-in to feature the story on the public landing page. Mirrors isPublic. */
    isPublic?: boolean;
}

export interface IStoryConfig {
    allowedPageCounts: number[];
    questionMinLength: number;
    questionMaxLength: number;
    questionSuggestions: string[];
}

export interface ICreateStoryPayload {
    childId: string;
    type: IStoryType;
    question: string;
    pageCount: number;
    artStyleId: string;
    language: ILanguage;
}

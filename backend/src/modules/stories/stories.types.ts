import type { ArtStyle, Child, Page, Story } from '../../generated/prisma/client.js';

/** S3 keys are internal — clients never see raw bucket paths. */
type StoryWithoutKeys = Omit<Story, 'coverImageKey' | 'pdfKey'>;

export interface IStorySummary extends StoryWithoutKeys {
    child: Pick<Child, 'id' | 'name' | 'birthdate'>;
    artStyle: Pick<ArtStyle, 'id' | 'name' | 'slug' | 'thumbnailUrl'>;
    /** Pre-signed S3 URL valid for 1 hour. Null until generation completes (Phase 5). */
    coverImageUrl: string | null;
}

export interface IStoryDetail extends IStorySummary {
    pages: Page[];
    /** Pre-signed S3 URL valid for 1 hour. Null until generation completes (Phase 5). */
    pdfUrl: string | null;
}

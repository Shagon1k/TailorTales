import type { StoryBlueprint } from '../../generated/prisma/client.js';

type StoryBlueprintWithoutKeys = Omit<StoryBlueprint, 'coverImageKey' | 'previewPageKeys'>;

/** Returned in list responses — systemPrompt excluded (LLM internals, verbose). */
export interface IStoryBlueprintSummary extends Omit<StoryBlueprintWithoutKeys, 'systemPrompt'> {
    coverImageUrl: string | null;
    previewPageUrls: string[];
}

/** Returned in detail + admin responses — includes systemPrompt. */
export interface IStoryBlueprintDetail extends StoryBlueprintWithoutKeys {
    coverImageUrl: string | null;
    previewPageUrls: string[];
}

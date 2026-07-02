import { z } from 'zod';

const storyPlanPageSchema = z.object({
    template: z.string(),
    text: z.string().nullable(),
    chapterTitle: z.string().nullable(),
    illustration: z.object({
        prompt: z.string(),
    }),
});

export const storyPlanSchema = z.object({
    title: z.string(),
    styleAnchor: z.string(),
    pages: z.array(storyPlanPageSchema),
});

export type IStoryPlan = z.infer<typeof storyPlanSchema>;
export type IStoryPlanPage = z.infer<typeof storyPlanPageSchema>;

export const STORY_PLAN_JSON_SCHEMA = {
    name: 'story_plan',
    schema: z.toJSONSchema(storyPlanSchema),
} as const;

export interface IGenerateStoryPlanInput {
    systemPrompt: string;
    userPrompt: string;
    maxTokens: number;
}

export interface IGenerateImageInput {
    prompt: string;
    /** Pixel dimensions, e.g. '1024x1536'. Read from PageTemplate config. */
    size: string;
    /** Matching aspect ratio string, e.g. '3:2'. Used by image APIs that honor aspect separately. */
    aspectRatio?: string;
    /** Optional reference images that help preserve recurring character appearance. */
    referenceImageUrls?: string[];
}

export interface IGeneratePageTextInput {
    systemPrompt: string;
    userPrompt: string;
    /**
     * Token ceiling for the response. Caller computes this from the page template's
     * maxChars and the story language (using CHARS_PER_TOKEN from generation.constants).
     */
    maxTokens: number;
}

export const characterProfileSchema = z.object({
    name: z.string(),
    description: z.string(),
});

export type ICharacterProfile = z.infer<typeof characterProfileSchema>;

export const CHARACTER_PROFILE_JSON_SCHEMA = {
    name: 'character_profile',
    schema: z.toJSONSchema(characterProfileSchema),
} as const;

export interface IGenerateCharacterProfileInput {
    /** Free-text prompt from the parent describing the character they want. */
    prompt: string;
    maxTokens: number;
}

const moderationResultSchema = z.object({
    safe: z.boolean(),
    reason: z.string().optional(),
});

export type IModerationResult = z.infer<typeof moderationResultSchema>;

export const moderationSchema = moderationResultSchema;

export const MODERATION_JSON_SCHEMA = {
    name: 'moderation_result',
    schema: z.toJSONSchema(moderationResultSchema),
} as const;

export interface IAiClient {
    generateStoryPlan(input: IGenerateStoryPlanInput): Promise<IStoryPlan>;
    generatePageText(input: IGeneratePageTextInput): Promise<string>;
    generateImage(input: IGenerateImageInput): Promise<Buffer>;
    generateCharacterProfile(input: IGenerateCharacterProfileInput): Promise<ICharacterProfile>;
    moderateText(text: string): Promise<IModerationResult>;
}

export const AI_CLIENT = Symbol('AI_CLIENT');

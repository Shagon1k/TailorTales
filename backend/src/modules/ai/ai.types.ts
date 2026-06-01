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
    /** Post-MVP seam for photo-reference character likeness. Ignored for now. */
    referenceImageKeys?: string[];
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
    generateImage(input: IGenerateImageInput): Promise<Buffer>;
    moderateText(text: string): Promise<IModerationResult>;
}

export const AI_CLIENT = Symbol('AI_CLIENT');

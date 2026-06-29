import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppError, ImageProhibitedContentError } from '../../common/errors.js';
import {
    type IAiClient,
    type ICharacterProfile,
    type IGenerateCharacterProfileInput,
    type IGenerateImageInput,
    type IGeneratePageTextInput,
    type IGenerateStoryPlanInput,
    type IModerationResult,
    type IStoryPlan,
    CHARACTER_PROFILE_JSON_SCHEMA,
    MODERATION_JSON_SCHEMA,
    STORY_PLAN_JSON_SCHEMA,
    characterProfileSchema,
    moderationSchema,
    storyPlanSchema,
} from './ai.types.js';
import { MODERATION_SYSTEM_PROMPT } from '../generation/generation.prompts.js';
import { CHARACTER_PROFILE_SYSTEM_PROMPT } from '../characters/characters.prompts.js';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

interface IImageGenerationRecord {
    b64_json?: string;
    url?: string;
}

function readOpenRouterErrorCode(text: string): string | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return null;
    }

    if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'error' in parsed &&
        typeof parsed.error === 'object' &&
        parsed.error !== null &&
        'metadata' in parsed.error &&
        typeof parsed.error.metadata === 'object' &&
        parsed.error.metadata !== null &&
        'code' in parsed.error.metadata &&
        typeof parsed.error.metadata.code === 'string'
    ) {
        return parsed.error.metadata.code;
    }

    return null;
}

@Injectable()
export class AiClient implements IAiClient {
    private readonly logger = new Logger(AiClient.name);
    private readonly apiKey: string;
    private readonly textModel: string;
    private readonly imageModel: string;

    constructor(private readonly config: ConfigService) {
        this.apiKey = this.config.getOrThrow<string>('OPENROUTER_API_KEY');
        this.textModel = this.config.getOrThrow<string>('OPENROUTER_TEXT_MODEL');
        this.imageModel = this.config.getOrThrow<string>('OPENROUTER_IMAGE_MODEL');
    }

    async generateStoryPlan(input: IGenerateStoryPlanInput): Promise<IStoryPlan> {
        this.logger.log(`Generating story plan (model: ${this.textModel})`);

        const body = {
            model: this.textModel,
            max_tokens: input.maxTokens,
            response_format: {
                type: 'json_schema',
                json_schema: STORY_PLAN_JSON_SCHEMA,
            },
            messages: [
                { role: 'system', content: input.systemPrompt },
                { role: 'user', content: input.userPrompt },
            ],
        };

        const data = await this.post<{ choices: { message: { content: string } }[] }>(
            '/chat/completions',
            body,
        );

        const raw = data.choices[0]?.message?.content;
        if (!raw) throw new Error('OpenRouter returned empty story plan content');

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error(`Story plan response was not valid JSON: ${raw.slice(0, 200)}`);
        }

        const result = storyPlanSchema.safeParse(parsed);
        if (!result.success) {
            throw new Error(`Story plan schema mismatch: ${result.error.message}`);
        }

        return result.data;
    }

    async generatePageText(input: IGeneratePageTextInput): Promise<string> {
        this.logger.log(`Generating page text (model: ${this.textModel})`);

        const body = {
            model: this.textModel,
            max_tokens: input.maxTokens,
            messages: [
                { role: 'system', content: input.systemPrompt },
                { role: 'user', content: input.userPrompt },
            ],
        };

        const data = await this.post<{ choices: { message: { content: string } }[] }>(
            '/chat/completions',
            body,
        );

        const text = data.choices[0]?.message?.content;
        if (!text?.trim()) throw new Error('OpenRouter returned empty page text content');
        return text.trim();
    }

    async generateCharacterProfile(
        input: IGenerateCharacterProfileInput,
    ): Promise<ICharacterProfile> {
        this.logger.log(`Generating character profile (model: ${this.textModel})`);

        const body = {
            model: this.textModel,
            max_tokens: input.maxTokens,
            response_format: {
                type: 'json_schema',
                json_schema: CHARACTER_PROFILE_JSON_SCHEMA,
            },
            messages: [
                { role: 'system', content: CHARACTER_PROFILE_SYSTEM_PROMPT },
                { role: 'user', content: input.prompt },
            ],
        };

        const data = await this.post<{ choices: { message: { content: string } }[] }>(
            '/chat/completions',
            body,
        );

        const raw = data.choices[0]?.message?.content;
        if (!raw) throw new Error('OpenRouter returned empty character profile content');

        let parsed: unknown;
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error(`Character profile response was not valid JSON: ${raw.slice(0, 200)}`);
        }

        const result = characterProfileSchema.safeParse(parsed);
        if (!result.success) {
            throw new Error(`Character profile schema mismatch: ${result.error.message}`);
        }

        return result.data;
    }

    async generateImage(input: IGenerateImageInput): Promise<Buffer> {
        this.logger.log(`Generating image (model: ${this.imageModel}, size: ${input.size})`);

        const body = {
            model: this.imageModel,
            prompt: input.prompt,
            aspect_ratio: input.aspectRatio ?? this.aspectRatioFromSize(input.size),
            input_references: input.referenceImageUrls?.map((url) => ({
                type: 'image_url',
                image_url: { url },
            })),
        };

        const data = await this.post<{ data: IImageGenerationRecord[] }>('/images', body);

        return this.extractGeneratedImageBuffer(data.data[0], input.size);
    }

    private aspectRatioFromSize(size: string): string {
        const match = /^(\d+)x(\d+)$/.exec(size);
        if (!match) {
            throw new Error(`Invalid image size format: ${size}`);
        }

        const width = Number.parseInt(match[1], 10);
        const height = Number.parseInt(match[2], 10);
        const divisor = this.greatestCommonDivisor(width, height);

        return `${width / divisor}:${height / divisor}`;
    }

    private greatestCommonDivisor(a: number, b: number): number {
        let x = a;
        let y = b;

        while (y !== 0) {
            const next = x % y;
            x = y;
            y = next;
        }

        return x;
    }

    async moderateText(text: string): Promise<IModerationResult> {
        this.logger.log('Moderating story text');

        const body = {
            model: this.textModel,
            max_tokens: 60,
            response_format: {
                type: 'json_schema',
                json_schema: MODERATION_JSON_SCHEMA,
            },
            messages: [
                {
                    role: 'system',
                    content: MODERATION_SYSTEM_PROMPT,
                },
                {
                    role: 'user',
                    content: `Review this children's book text:\n\n${text.slice(0, 3000)}`,
                },
            ],
        };

        try {
            const data = await this.post<{ choices: { message: { content: string } }[] }>(
                '/chat/completions',
                body,
            );
            const raw = data.choices[0]?.message?.content;
            if (!raw) return { safe: true };

            const parsed = moderationSchema.safeParse(JSON.parse(raw));
            if (!parsed.success) {
                this.logger.warn(
                    `Moderation schema mismatch — defaulting to safe: ${parsed.error.message}`,
                );
                return { safe: true };
            }
            return parsed.data;
        } catch {
            // Moderation failures are non-fatal — log and allow rather than block stories
            this.logger.warn('Moderation check failed — defaulting to safe');
            return { safe: true };
        }
    }

    private async extractUrlImageBuffer(url: string): Promise<Buffer> {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Failed to download generated image: ${res.status} ${res.statusText}`);
        }

        return Buffer.from(await res.arrayBuffer());
    }

    private async extractGeneratedImageBuffer(
        image: IImageGenerationRecord | undefined,
        size: string,
    ): Promise<Buffer> {
        if (image?.b64_json) {
            return Buffer.from(image.b64_json, 'base64');
        }

        if (image?.url) {
            return this.extractUrlImageBuffer(image.url);
        }

        const preview = JSON.stringify(image).slice(0, 240);
        this.logger.error(`Unknown /images response format (size: ${size}): ${preview}`);
        throw new Error(`Unexpected /images response format from OpenRouter (size: ${size})`);
    }

    private async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
        let attempt = 0;
        let lastError: Error = new Error('No attempts made');

        while (attempt <= MAX_RETRIES) {
            if (attempt > 0) {
                const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
                this.logger.warn(`Retry ${attempt}/${MAX_RETRIES} in ${delay}ms`);
                await new Promise((r) => setTimeout(r, delay));
            }

            try {
                const res = await fetch(`${OPENROUTER_BASE}${path}`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (res.status >= 400 && res.status < 500) {
                    const text = await res.text();
                    this.logger.error(`OpenRouter ${res.status} on ${path}: ${text.slice(0, 500)}`);
                    if (
                        path === '/images' &&
                        readOpenRouterErrorCode(text) === 'IMAGE_PROHIBITED_CONTENT'
                    ) {
                        throw Object.assign(new ImageProhibitedContentError(), {
                            permanent: true,
                        });
                    }
                    const userMessage =
                        res.status === 429
                            ? 'AI service rate limit reached. Please try again in a moment.'
                            : 'AI service request failed. Please try again.';
                    throw Object.assign(new AppError(userMessage), { permanent: true });
                }

                if (!res.ok) {
                    const text = await res.text();
                    this.logger.error(`OpenRouter ${res.status} on ${path}: ${text.slice(0, 500)}`);
                    throw new AppError('AI service temporarily unavailable. Please try again.');
                }

                return res.json() as Promise<TResponse>;
            } catch (err: unknown) {
                const error = err instanceof Error ? err : new Error(String(err));
                lastError = error;

                if ('permanent' in error && (error as { permanent: boolean }).permanent) {
                    throw error;
                }

                attempt++;
            }
        }

        throw lastError;
    }
}

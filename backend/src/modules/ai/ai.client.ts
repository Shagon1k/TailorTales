import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    type IAiClient,
    type IGenerateImageInput,
    type IGenerateStoryPlanInput,
    type IStoryPlan,
    STORY_PLAN_JSON_SCHEMA,
    storyPlanSchema,
} from './ai.types.js';
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 1_000;

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

    async generateImage(input: IGenerateImageInput): Promise<Buffer> {
        this.logger.log(`Generating image (model: ${this.imageModel}, size: ${input.size})`);

        const [width, height] = input.size.split('x').map(Number);

        const body = {
            model: this.imageModel,
            messages: [{ role: 'user', content: input.prompt }],
            modalities: ['image'],
            image_size: { width, height },
        };

        const data = await this.post<{
            choices: { message: { content: unknown } }[];
        }>('/chat/completions', body);

        return this.extractImageBuffer(data.choices[0]?.message?.content, input.size);
    }

    private extractImageBuffer(content: unknown, size: string): Buffer {
        // OpenRouter image models return content as an array of parts or a plain string.
        // Handle both shapes — the exact format depends on the underlying model.
        if (Array.isArray(content)) {
            for (const part of content) {
                if (
                    part &&
                    typeof part === 'object' &&
                    'type' in part &&
                    part.type === 'image_url' &&
                    'image_url' in part &&
                    part.image_url &&
                    typeof part.image_url === 'object' &&
                    'url' in part.image_url &&
                    typeof part.image_url.url === 'string'
                ) {
                    return this.dataUrlToBuffer(part.image_url.url);
                }
            }
        }

        if (typeof content === 'string' && content.startsWith('data:')) {
            return this.dataUrlToBuffer(content);
        }

        throw new Error(
            `Unexpected image response format from OpenRouter (size: ${size}). ` +
                `Content type: ${typeof content}`,
        );
    }

    private dataUrlToBuffer(dataUrl: string): Buffer {
        const comma = dataUrl.indexOf(',');
        if (comma === -1) throw new Error('Malformed data URL — no comma separator');
        return Buffer.from(dataUrl.slice(comma + 1), 'base64');
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
                    // 4xx = caller error — no point retrying
                    throw Object.assign(
                        new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`),
                        { status: res.status, permanent: true },
                    );
                }

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
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

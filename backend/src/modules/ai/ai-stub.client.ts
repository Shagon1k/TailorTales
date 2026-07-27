import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import type {
    IAiClient,
    ICharacterProfile,
    IGenerateCharacterProfileInput,
    IGenerateImageInput,
    IGeneratePageTextInput,
    IGenerateStoryPlanInput,
    IModerationResult,
    IStoryPlan,
} from './ai.types.js';
import { BOOK_INTERIOR_TEMPLATE_NAMES } from '../rendering/page-templates.config.js';

const placeholderImageBuffer = readFileSync(join(__dirname, '../rendering/assets/placeholder.png'));

/** Deterministic stub — returns canned responses with zero network calls. */
@Injectable()
export class AiStubClient implements IAiClient {
    private readonly logger = new Logger(AiStubClient.name);

    async generateStoryPlan(input: IGenerateStoryPlanInput): Promise<IStoryPlan> {
        this.logger.log(`[STUB] Generating story plan (${input.maxTokens} max tokens)`);

        const interiorCount = this.extractPageCount(input.userPrompt) - 2;
        const interiorTemplates = BOOK_INTERIOR_TEMPLATE_NAMES;

        const interiorPages = Array.from({ length: Math.max(0, interiorCount) }, (_, i) => ({
            template: interiorTemplates[i % interiorTemplates.length],
            navigationTitle: `A curious discovery ${i + 1}`,
            chapterTitle: `Chapter ${i + 1}`,
            text: `Once upon a time, on page ${i + 2}, something wonderful happened. The story continued with careful attention to the child's curiosity and wonder.`,
            illustration: {
                prompt: `A warm, child-friendly illustration for page ${i + 2} in a storybook style.`,
            },
        }));

        return {
            title: 'The Curious Little Question',
            styleAnchor:
                'A friendly fox character with amber fur, wearing a small blue scarf. Warm earthy tones throughout. Soft, rounded shapes suitable for young children.',
            pages: [
                {
                    template: 'book-cover',
                    text: 'The Curious Little Question',
                    navigationTitle: 'Cover',
                    chapterTitle: null,
                    illustration: {
                        prompt: 'A charming storybook cover illustration featuring a fox looking up at a starry sky with wonder.',
                    },
                },
                ...interiorPages,
                {
                    template: 'book-final',
                    text: 'And so the question was answered, and the child went to sleep with a smile, knowing the world was full of wonderful mysteries waiting to be discovered.',
                    navigationTitle: 'A gentle ending',
                    chapterTitle: null,
                    illustration: {
                        prompt: 'A cozy final illustration of a child sleeping peacefully, with a small fox watching over.',
                    },
                },
            ],
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async generatePageText(_input: IGeneratePageTextInput): Promise<string> {
        this.logger.log('[STUB] Generating page text');
        return 'The sun rose over the mountain, casting golden light across the valley. The little explorer looked around with wide eyes, ready for the adventure ahead.';
    }

    async generateCharacterProfile(
        input: IGenerateCharacterProfileInput,
    ): Promise<ICharacterProfile> {
        this.logger.log('[STUB] Generating character profile');
        return {
            name: 'Pip',
            description: `A friendly character inspired by: ${input.prompt.slice(0, 120)}. Round amber eyes, tousled brown hair, and a cosy green jumper.`,
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async moderateText(_text: string): Promise<IModerationResult> {
        return { safe: true };
    }

    async generateImage(_input: IGenerateImageInput): Promise<Buffer> {
        this.logger.log(`[STUB] Generating image (size: ${_input.size})`);
        return placeholderImageBuffer;
    }

    private extractPageCount(userPrompt: string): number {
        // Matches "5-page", "5 pages", or "exactly 5" — all used in prompt builder output
        const match = /(\d+)[-\s]pages?/i.exec(userPrompt) ?? /exactly (\d+)/i.exec(userPrompt);
        return match ? Number.parseInt(match[1], 10) : 5;
    }
}

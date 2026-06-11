import {
    BadRequestException,
    ForbiddenException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import type { Child, Page, Story } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { endsWithCompleteSentence } from '../../common/text.utils.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { PdfBindingService } from '../rendering/pdf-binding.service.js';
import { PAGE_TEMPLATES } from '../rendering/page-templates.config.js';
import { AI_CLIENT, type IAiClient } from '../ai/ai.types.js';
import { CHARS_PER_TOKEN } from '../generation/generation.constants.js';
import { FREE_TIER_REGENERATION_LIMIT, REGEN_WINDOW_DAYS } from './regeneration.constants.js';
import { buildPageTextSystemPrompt, buildPageTextUserPrompt } from './regeneration.prompts.js';
import type { RegeneratePageDto } from './dto/regenerate-page.dto.js';

type StoryForRegen = Story & {
    child: Pick<Child, 'name'>;
};

@Injectable()
export class RegenerationService {
    private readonly logger = new Logger(RegenerationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly pdfBinding: PdfBindingService,
        @Inject(AI_CLIENT) private readonly ai: IAiClient,
    ) {}

    async regeneratePage(
        storyId: string,
        pageOrder: number,
        userId: string,
        dto: RegeneratePageDto,
    ): Promise<void> {
        // 1. Ownership + status check
        const story = await this.prisma.story.findFirst({
            where: { id: storyId, userId },
            include: { child: { select: { name: true } } },
        });
        if (!story) throw new NotFoundException(`Story ${storyId} not found`);
        if (story.status !== 'COMPLETED') {
            throw new BadRequestException('Only COMPLETED stories can have pages regenerated');
        }

        // 2. Page lookup
        const page = await this.prisma.page.findUnique({
            where: { storyId_order: { storyId, order: pageOrder } },
        });
        if (!page)
            throw new NotFoundException(`Page order ${pageOrder} not found in story ${storyId}`);

        // 3. Fail-fast quota check (read-only — no increment and no reset yet)
        await this.checkQuota(userId);

        // 4. Compute phase — all AI calls, zero DB/S3 writes
        //    Both calls may run; neither is persisted until both succeed.
        let newText: string | undefined;
        let newImageBuffer: Buffer | undefined;

        if (dto.what === 'text' || dto.what === 'both') {
            newText = await this.generatePageText(story, page, dto.prompt);
        }

        if (dto.what === 'illustration' || dto.what === 'both') {
            newImageBuffer = await this.generatePageImage(story, page, dto.prompt);
        }

        // 5. Persist phase — only reached when all AI calls above succeeded
        if (newText !== undefined) {
            await this.prisma.page.update({
                where: { id: page.id },
                data: { text: newText },
            });
        }

        if (newImageBuffer !== undefined) {
            await this.persistPageImage(story, page, newImageBuffer);
        }

        // 6. PDF re-stitch
        await this.restitchPdf(story);

        // 7. Quota consumption + COMPLETED Job — written together, success only
        await this.recordSuccessfulRegeneration(userId, storyId);

        this.logger.log(
            `Regenerated page ${pageOrder} (${dto.what}) for story ${storyId} — user ${userId}`,
        );
    }

    // ---------------------------------------------------------------------------
    // Quota
    // ---------------------------------------------------------------------------

    /**
     * Reads the user's current quota state.
     * Throws ForbiddenException when the limit has been reached for the current window.
     * Does NOT mutate quota state — the 30-day window starts only after successful regeneration.
     *
     * TODO(Phase 9): replace User quota fields with Subscription.regenerationsUsed vs
     *   PricingTier.regenerationsPerMonth. Rolling-window reset logic below also goes away.
     */
    private async checkQuota(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { regenerationsInWindow: true, regenerationWindowStartedAt: true },
        });
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (this.isQuotaWindowExpired(user.regenerationWindowStartedAt, new Date())) return;

        if (user.regenerationsInWindow >= FREE_TIER_REGENERATION_LIMIT) {
            throw new ForbiddenException(
                `Regeneration quota of ${FREE_TIER_REGENERATION_LIMIT} per ${REGEN_WINDOW_DAYS} days has been reached`,
            );
        }
    }

    private async recordSuccessfulRegeneration(userId: string, storyId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { regenerationsInWindow: true, regenerationWindowStartedAt: true },
            });
            if (!user) throw new NotFoundException(`User ${userId} not found`);

            const now = new Date();
            const windowExpired = this.isQuotaWindowExpired(user.regenerationWindowStartedAt, now);

            await tx.user.update({
                where: { id: userId },
                data: windowExpired
                    ? { regenerationsInWindow: 1, regenerationWindowStartedAt: now }
                    : { regenerationsInWindow: { increment: 1 } },
            });

            await tx.job.create({
                data: { storyId, type: 'REGENERATION', status: 'COMPLETED' },
            });
        });
    }

    private isQuotaWindowExpired(windowStart: Date | null, now: Date): boolean {
        return (
            !windowStart ||
            now.getTime() - windowStart.getTime() > REGEN_WINDOW_DAYS * 24 * 60 * 60 * 1000
        );
    }

    // ---------------------------------------------------------------------------
    // Text regeneration
    // ---------------------------------------------------------------------------

    private async generatePageText(
        story: StoryForRegen,
        page: Page,
        authorNote?: string,
    ): Promise<string> {
        const tpl = PAGE_TEMPLATES[page.layout ?? ''];
        const maxChars = tpl ? Math.max(...Object.values(tpl.maxChars)) : 400;
        const charsPerToken = CHARS_PER_TOKEN[story.language];
        const maxTokens = Math.min(Math.ceil((maxChars / charsPerToken) * 2), 500);

        const systemPrompt = buildPageTextSystemPrompt();
        const userPrompt = buildPageTextUserPrompt({
            storyTitle: story.title,
            childName: story.child.name,
            pageOrder: page.order,
            layout: page.layout,
            chapterTitle: page.chapterTitle,
            currentText: page.text,
            authorNote,
        });

        let text = await this.ai.generatePageText({ systemPrompt, userPrompt, maxTokens });

        if (!endsWithCompleteSentence(text)) {
            this.logger.warn(
                `Page ${page.order} text regen did not end with a complete sentence — retrying`,
            );
            text = await this.ai.generatePageText({ systemPrompt, userPrompt, maxTokens });
            if (!endsWithCompleteSentence(text)) {
                throw new Error(
                    `Regenerated text for page ${page.order} did not end with a complete sentence after retry`,
                );
            }
        }

        return text;
    }

    // ---------------------------------------------------------------------------
    // Illustration regeneration
    // ---------------------------------------------------------------------------

    private async generatePageImage(
        story: StoryForRegen,
        page: Page,
        authorNote?: string,
    ): Promise<Buffer> {
        if (!page.illustrationPrompt) {
            throw new BadRequestException(`Page ${page.order} has no illustration prompt stored`);
        }

        const tpl = PAGE_TEMPLATES[page.layout ?? ''];
        if (!tpl || tpl.images.length === 0) {
            throw new BadRequestException(
                `Page ${page.order} layout "${page.layout}" has no image slot`,
            );
        }

        const imageSlot = tpl.images[0];
        const prompt = [
            story.styleAnchor,
            page.illustrationPrompt,
            authorNote ? `Requested change: ${authorNote}` : null,
        ]
            .filter(Boolean)
            .join('\n\n');

        this.logger.log(`Generating image for page ${page.order} (${imageSlot.size})`);

        return this.ai.generateImage({ prompt, size: imageSlot.size });
    }

    private async persistPageImage(
        story: StoryForRegen,
        page: Page,
        imageBuffer: Buffer,
    ): Promise<void> {
        const tpl = PAGE_TEMPLATES[page.layout ?? ''];
        const imageSlot = tpl!.images[0];

        const key = StorageKeys.pageIllustration(story.userId, story.id, page.order);
        await this.storage.upload(imageBuffer, key, 'image/png');

        await this.prisma.page.update({
            where: { id: page.id },
            data: { illustrations: [{ key, position: imageSlot.name }] },
        });

        if (page.order === 1) {
            await this.prisma.story.update({
                where: { id: story.id },
                data: { coverImageKey: key },
            });
        }

        this.logger.log(`Page ${page.order} illustration stored: ${key}`);
    }

    // ---------------------------------------------------------------------------
    // PDF re-stitch
    // ---------------------------------------------------------------------------

    private async restitchPdf(story: StoryForRegen): Promise<void> {
        const pages = await this.prisma.page.findMany({
            where: { storyId: story.id },
            orderBy: { order: 'asc' },
        });

        await this.pdfBinding.buildAndStore(story, pages);

        this.logger.log(`PDF re-stitched for story ${story.id}`);
    }
}

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppError } from '../../common/errors.js';
import type {
    ArtStyle,
    Character,
    Child,
    Page,
    Story,
    StoryBlueprint,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { PdfBindingService } from '../rendering/pdf-binding.service.js';
import { PAGE_TEMPLATES } from '../rendering/page-templates.config.js';
import { AI_CLIENT, type IAiClient, type IStoryPlan } from '../ai/ai.types.js';
import { NotificationEmitterService } from '../notifications/notification-emitter.service.js';
import { QuotaService } from '../subscriptions/quota.service.js';
import { StoryPromptBuilder } from './story-prompt-builder.js';
import { StoryPlanValidator } from './story-plan.validator.js';
import { IMAGE_CONCURRENCY, computeMaxTokens } from './generation.constants.js';
import { IMAGE_NO_TEXT_DIRECTIVE } from './generation.prompts.js';

type StoryWithRelations = Story & {
    child: Pick<Child, 'id' | 'name' | 'birthdate' | 'interests'>;
    artStyle: Pick<ArtStyle, 'id' | 'name' | 'promptPrefix'>;
};

@Injectable()
export class GenerationPipeline {
    private readonly logger = new Logger(GenerationPipeline.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly pdfBinding: PdfBindingService,
        private readonly promptBuilder: StoryPromptBuilder,
        private readonly validator: StoryPlanValidator,
        private readonly notifications: NotificationEmitterService,
        private readonly quotaService: QuotaService,
        @Inject(AI_CLIENT) private readonly ai: IAiClient,
    ) {}

    async run(jobId: string): Promise<void> {
        const job = await this.prisma.job.findUnique({ where: { id: jobId } });
        if (!job) throw new NotFoundException(`Job ${jobId} not found`);

        const story = await this.loadStory(job.storyId);

        await this.setJobStage(jobId, 'planning');
        await this.prisma.story.update({
            where: { id: story.id },
            data: { status: 'GENERATING' },
        });

        try {
            const storyPlan = await this.runPlanning(story);

            await this.setJobStage(jobId, 'moderation');
            await this.runModeration(storyPlan);

            await this.setJobStage(jobId, 'pictures');
            const pages = await this.runPictures(story);

            await this.setJobStage(jobId, 'binding');
            await this.pdfBinding.buildAndStore(story, pages);

            await this.setJobStage(jobId, 'ready');
            await this.runReady(story);

            await this.prisma.job.update({
                where: { id: jobId },
                data: { status: 'COMPLETED' },
            });

            // Notification (DB bell record + email) — failure here must not undo
            // the successful generation, so the notification emitter swallows email errors.
            await this.notifications.storyCompleted(story.userId, {
                storyId: story.id,
                title: storyPlan.title,
                childName: story.child.name,
            });
        } catch (err: unknown) {
            const techMessage = err instanceof Error ? err.message : String(err);
            const stack = err instanceof Error ? err.stack : undefined;
            this.logger.error(
                `Pipeline failed for job ${jobId} (story ${story.id}): ${techMessage}`,
                stack,
            );
            const message =
                err instanceof AppError
                    ? err.message
                    : 'Something went wrong during generation. Please try again.';

            await this.prisma.job
                .update({
                    where: { id: jobId },
                    data: { status: 'FAILED', error: message },
                })
                .catch(() => undefined);

            await this.prisma.story
                .update({
                    where: { id: story.id },
                    data: { status: 'FAILED' },
                })
                .catch(() => undefined);

            await this.notifications
                .storyFailed(story.userId, {
                    storyId: story.id,
                    childName: story.child.name,
                    question: story.question,
                    error: message,
                })
                .catch(() => undefined);

            throw err;
        }
    }

    // ---------------------------------------------------------------------------
    // Stage 1 — Planning
    // ---------------------------------------------------------------------------

    private async runPlanning(story: StoryWithRelations): Promise<IStoryPlan> {
        const blueprint = await this.selectBlueprint(story.type);
        const character = await this.loadCharacterForStory(story);

        const systemPrompt = this.promptBuilder.buildSystemPrompt(blueprint);
        const userPrompt = this.promptBuilder.buildUserPrompt({
            child: story.child,
            artStyle: story.artStyle,
            blueprint,
            question: story.question,
            pageCount: story.pageCount,
            language: story.language,
            character: character ?? undefined,
            genre: story.genre,
            writingStyle: story.writingStyle,
        });
        const maxTokens = computeMaxTokens(story.pageCount, story.language);

        let plan = await this.ai.generateStoryPlan({ systemPrompt, userPrompt, maxTokens });
        let result = this.validator.validate(plan, story.pageCount, story.type);

        if (result.structuralErrors.length > 0) {
            this.logger.warn(
                `Structural errors on first attempt — retrying: ${result.structuralErrors.join('; ')}`,
            );

            const repairPrompt =
                userPrompt +
                '\n\n# CORRECTION REQUIRED\nThe previous response had these errors:\n' +
                result.structuralErrors.map((e) => `  - ${e}`).join('\n') +
                '\nFix all of them in your next response.';

            plan = await this.ai.generateStoryPlan({
                systemPrompt,
                userPrompt: repairPrompt,
                maxTokens,
            });
            result = this.validator.validate(plan, story.pageCount, story.type);

            if (result.structuralErrors.length > 0) {
                throw new Error(
                    `Story plan structural validation failed after repair: ${result.structuralErrors.join('; ')}`,
                );
            }
        }

        if (result.lengthOverflows.length > 0) {
            this.logger.warn(
                `${result.lengthOverflows.length} text length overflow(s) — CSS will handle visual clipping`,
            );
        }

        await this.persistStoryPlan(story, plan, blueprint.id);
        return plan;
    }

    private async selectBlueprint(type: 'BOOK' | 'COMIC'): Promise<StoryBlueprint> {
        const blueprint = await this.prisma.storyBlueprint.findFirst({
            where: { type },
            orderBy: { createdAt: 'asc' },
        });
        if (!blueprint) throw new Error(`No StoryBlueprint found for type ${type}`);
        return blueprint;
    }

    private async persistStoryPlan(
        story: StoryWithRelations,
        plan: IStoryPlan,
        blueprintId: string,
    ): Promise<void> {
        // characterId is set by the user at story creation — the pipeline never overwrites it.
        await this.prisma.story.update({
            where: { id: story.id },
            data: { title: plan.title, styleAnchor: plan.styleAnchor, blueprintId },
        });

        await this.prisma.page.createMany({
            data: plan.pages.map((p, i) => ({
                storyId: story.id,
                order: i + 1,
                layout: p.template,
                chapterTitle: p.chapterTitle ?? null,
                text: p.text ?? null,
                illustrationPrompt: p.illustration.prompt,
                illustrations: [],
            })),
        });
    }

    // ---------------------------------------------------------------------------
    // Stage 2 — Moderation
    // ---------------------------------------------------------------------------

    private async runModeration(plan: IStoryPlan): Promise<void> {
        const allText = plan.pages
            .map((p) => p.text)
            .filter(Boolean)
            .join('\n\n');

        if (!allText.trim()) return;

        const result = await this.ai.moderateText(allText);
        if (!result.safe) {
            throw new Error(
                `Content moderation failed: ${result.reason ?? 'unsafe content detected'}`,
            );
        }
    }

    // ---------------------------------------------------------------------------
    // Stage 3 — Pictures
    // ---------------------------------------------------------------------------

    private async runPictures(story: StoryWithRelations): Promise<Page[]> {
        const pages = await this.prisma.page.findMany({
            where: { storyId: story.id },
            orderBy: { order: 'asc' },
        });

        const withImages = pages.filter((p) => {
            const tpl = PAGE_TEMPLATES[p.layout ?? ''];
            return tpl && tpl.images.length > 0;
        });

        // Fan out with capped concurrency
        for (let i = 0; i < withImages.length; i += IMAGE_CONCURRENCY) {
            await Promise.all(
                withImages
                    .slice(i, i + IMAGE_CONCURRENCY)
                    .map((page) => this.generateAndStorePicture(story, page)),
            );
        }

        const updated = await this.prisma.page.findMany({
            where: { storyId: story.id },
            orderBy: { order: 'asc' },
        });

        const coverPage = updated[0];
        const coverIllustrations = coverPage?.illustrations as Array<{ key: string }> | null;
        const coverKey = coverIllustrations?.[0]?.key;
        if (coverKey) {
            await this.prisma.story.update({
                where: { id: story.id },
                data: { coverImageKey: coverKey },
            });
        }

        return updated;
    }

    private async generateAndStorePicture(story: StoryWithRelations, page: Page): Promise<void> {
        const tpl = PAGE_TEMPLATES[page.layout ?? ''];
        if (!tpl || tpl.images.length === 0) return;

        // illustrationPrompt is stored on the Page row during Planning — no plan lookup needed
        if (!page.illustrationPrompt) return;

        const imageSlot = tpl.images[0];
        const prompt =
            `${story.styleAnchor ?? ''}\n\n${page.illustrationPrompt}\n\n${IMAGE_NO_TEXT_DIRECTIVE}`.trim();

        this.logger.log(`Generating image for page ${page.order} (${imageSlot.size})`);

        const imageBuffer = await this.ai.generateImage({
            prompt,
            size: imageSlot.size,
        });

        const key = StorageKeys.pageIllustration(story.userId, story.id, page.order);
        await this.storage.upload(imageBuffer, key, 'image/png');

        await this.prisma.page.update({
            where: { id: page.id },
            data: {
                illustrations: [{ key, position: imageSlot.name }],
            },
        });

        this.logger.log(`Page ${page.order} illustration stored: ${key}`);
    }

    // ---------------------------------------------------------------------------
    // Stage 4 — Binding: delegates to PdfBindingService (shared with regeneration)
    // ---------------------------------------------------------------------------

    // ---------------------------------------------------------------------------
    // Stage 5 — Ready
    // ---------------------------------------------------------------------------

    private async runReady(story: StoryWithRelations): Promise<void> {
        await this.prisma.story.update({
            where: { id: story.id },
            data: { status: 'COMPLETED' },
        });

        // Credits are deducted only on success — FAILED stories never charge the user.
        await this.quotaService.deductPageCredits(story.userId, story.pageCount, story.type);

        this.logger.log(`Story ${story.id} completed`);
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Loads the protagonist the user chose for this story (`story.characterId`).
     * Returns null when none was chosen — the pipeline continues child-led.
     * Uses PrismaService directly so GenerationModule has no dependency on CharactersModule.
     */
    private async loadCharacterForStory(
        story: Story,
    ): Promise<Pick<Character, 'id' | 'name' | 'description'> | null> {
        if (!story.characterId) return null;
        return this.prisma.character.findFirst({
            where: { id: story.characterId, userId: story.userId },
            select: { id: true, name: true, description: true },
        });
    }

    private async loadStory(storyId: string): Promise<StoryWithRelations> {
        const story = await this.prisma.story.findUnique({
            where: { id: storyId },
            include: {
                child: { select: { id: true, name: true, birthdate: true, interests: true } },
                artStyle: { select: { id: true, name: true, promptPrefix: true } },
            },
        });
        if (!story) throw new NotFoundException(`Story ${storyId} not found`);
        return story;
    }

    private async setJobStage(jobId: string, stage: string): Promise<void> {
        await this.prisma.job.update({
            where: { id: jobId },
            data: { stage, status: 'ACTIVE' },
        });
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import type { ArtStyle, Child, Page, Story } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { PdfRendererService } from '../rendering/pdf-renderer.service.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import { PUBLIC_STORIES_LIMIT } from './stories.constants.js';
import type { IStoryDetail, IStorySummary } from './stories.types.js';

type StoryWithRelations = Story & {
    child: Pick<Child, 'id' | 'name' | 'birthdate'>;
    artStyle: Pick<ArtStyle, 'id' | 'name' | 'slug' | 'thumbnailUrl'>;
};

type StoryWithRelationsAndPages = StoryWithRelations & { pages: Page[] };

const STORY_LIST_INCLUDE = {
    child: { select: { id: true, name: true, birthdate: true } },
    artStyle: { select: { id: true, name: true, slug: true, thumbnailUrl: true } },
} as const;

@Injectable()
export class StoriesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly renderer: PdfRendererService,
    ) {}

    async findAllByUser(userId: string): Promise<IStorySummary[]> {
        const stories = await this.prisma.story.findMany({
            where: { userId },
            include: STORY_LIST_INCLUDE,
            orderBy: { createdAt: 'desc' },
        });

        return Promise.all(stories.map((s) => this.toSummary(s)));
    }

    async findOneByUser(id: string, userId: string): Promise<IStoryDetail> {
        const story = await this.prisma.story.findFirst({
            where: { id, userId },
            include: { ...STORY_LIST_INCLUDE, pages: { orderBy: { order: 'asc' } } },
        });

        if (!story) throw new NotFoundException(`Story ${id} not found`);

        return this.toDetail(story);
    }

    async findPublic(): Promise<IStorySummary[]> {
        const stories = await this.prisma.story.findMany({
            where: { isPublic: true, status: 'COMPLETED' },
            include: STORY_LIST_INCLUDE,
            orderBy: { updatedAt: 'desc' },
            take: PUBLIC_STORIES_LIMIT,
        });

        return Promise.all(stories.map((s) => this.toSummary(s)));
    }

    create(userId: string, dto: CreateStoryDto): Promise<Story> {
        // blueprintId is intentionally absent — the generation pipeline auto-selects
        // the appropriate StoryBlueprint by StoryType in Phase 5.
        return this.prisma.story.create({
            data: {
                userId,
                childId: dto.childId,
                type: dto.type,
                question: dto.question,
                pageCount: dto.pageCount,
                artStyleId: dto.artStyleId,
                language: dto.language,
            },
        });
    }

    async remove(id: string, userId: string): Promise<void> {
        const story = await this.prisma.story.findFirst({ where: { id, userId } });
        if (!story) throw new NotFoundException(`Story ${id} not found`);

        // Phase 5: add S3 asset deletion here (coverImageKey, pdfKey, page illustrations)
        // when generation produces files. DRAFT stories have no assets yet.

        await this.prisma.story.delete({ where: { id } });
    }

    async getPageHtml(storyId: string, pageOrder: number, userId: string): Promise<string> {
        const story = await this.prisma.story.findFirst({
            where: { id: storyId, userId },
            include: { child: { select: { name: true } } },
        });
        if (!story) throw new NotFoundException(`Story ${storyId} not found`);

        const page = await this.prisma.page.findFirst({
            where: { storyId, order: pageOrder },
        });
        if (!page) throw new NotFoundException(`Page ${pageOrder} not found in story ${storyId}`);

        const illustrations = page.illustrations as Array<{ key: string }> | null;
        const imageKey = illustrations?.[0]?.key ?? null;
        let imageBase64: string | null = null;
        if (imageKey) {
            const url = await this.storage.getSignedUrl(imageKey);
            const resp = await fetch(url);
            const buf = await resp.arrayBuffer();
            imageBase64 = Buffer.from(buf).toString('base64');
        }

        return this.renderer.buildPageHtml(
            {
                order: page.order,
                layout: page.layout ?? 'book-text',
                text: page.text,
                chapterTitle: page.chapterTitle,
                imageBase64,
            },
            {
                title: story.title ?? story.question,
                childName: story.child.name,
                pages: [],
                watermark: true, // Phase 9 wires real tier check
            },
        );
    }

    // --- private helpers ---

    private async toSummary(story: StoryWithRelations): Promise<IStorySummary> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { coverImageKey, pdfKey: _pdfKey, ...rest } = story;

        return {
            ...rest,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
        };
    }

    private async toDetail(story: StoryWithRelationsAndPages): Promise<IStoryDetail> {
        const { coverImageKey, pdfKey, pages, ...rest } = story;

        const resolvedPages = await Promise.all(
            pages.map(async (page) => {
                const rawIllustrations = page.illustrations as Array<{
                    key: string;
                    position?: string;
                }> | null;

                const illustrations = await Promise.all(
                    (rawIllustrations ?? []).map(async ({ key, position }) => ({
                        url: await this.storage.getSignedUrl(key),
                        position,
                    })),
                );

                return { ...page, illustrations };
            }),
        );

        return {
            ...rest,
            pages: resolvedPages,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            pdfUrl: pdfKey ? await this.storage.getSignedUrl(pdfKey) : null,
        };
    }
}

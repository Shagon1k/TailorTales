import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
    type ArtStyle,
    type Child,
    type Page,
    type Story,
    Prisma,
} from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { PdfRendererService } from '../rendering/pdf-renderer.service.js';
import { QuotaService } from '../subscriptions/quota.service.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import { PUBLIC_STORIES_LIMIT } from './stories.constants.js';
import type {
    IAdminStoryListPage,
    IAdminStorySummary,
    IStoryArtStyle,
    IStoryDetail,
    IStorySummary,
} from './stories.types.js';

/** Story row with the relations the admin moderation table needs. */
type StoryWithOwner = Story & {
    user: { id: string; name: string; email: string };
    child: { name: string };
    artStyle: { name: string };
};

/** Story row carrying just the keys needed to purge S3 assets on delete. */
type StoryWithAssetKeys = Pick<Story, 'pdfKey' | 'coverImageKey'> & {
    pages: { illustrations: Page['illustrations'] }[];
};

type StoryWithRelations = Story & {
    child: Pick<Child, 'id' | 'name' | 'birthdate'>;
    artStyle: Pick<ArtStyle, 'id' | 'name' | 'slug' | 'thumbnailKey'>;
    // At most one rating per story — only the owner can rate it.
    ratings: { score: number; comment: string | null }[];
};

type StoryWithRelationsAndPages = StoryWithRelations & { pages: Page[] };

const STORY_LIST_INCLUDE = {
    child: { select: { id: true, name: true, birthdate: true } },
    artStyle: { select: { id: true, name: true, slug: true, thumbnailKey: true } },
    ratings: { select: { score: true, comment: true } },
} as const;

@Injectable()
export class StoriesService {
    private readonly logger = new Logger(StoriesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly renderer: PdfRendererService,
        private readonly quotaService: QuotaService,
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

    /** Admin override of a story's public visibility — no ownership scope. */
    async setPublicVisibility(id: string, isPublic: boolean): Promise<void> {
        const story = await this.prisma.story.findUnique({ where: { id }, select: { id: true } });
        if (!story) throw new NotFoundException(`Story ${id} not found`);

        await this.prisma.story.update({ where: { id }, data: { isPublic } });
    }

    async remove(id: string, userId: string): Promise<void> {
        const story = await this.prisma.story.findFirst({
            where: { id, userId },
            include: { pages: { select: { illustrations: true } } },
        });
        if (!story) throw new NotFoundException(`Story ${id} not found`);

        await this.purgeAndDelete(id, story);
    }

    /** Force-delete any story regardless of owner — admin moderation. */
    async removeAsAdmin(id: string): Promise<void> {
        const story = await this.prisma.story.findUnique({
            where: { id },
            include: { pages: { select: { illustrations: true } } },
        });
        if (!story) throw new NotFoundException(`Story ${id} not found`);

        await this.purgeAndDelete(id, story);
    }

    /** Delete a story's S3 assets, then the row. Shared by owner-delete and admin force-delete. */
    private async purgeAndDelete(id: string, story: StoryWithAssetKeys): Promise<void> {
        const keys = [
            story.pdfKey,
            story.coverImageKey,
            ...story.pages.flatMap((page) => {
                const illustrations = page.illustrations as Array<{ key: string }> | null;
                return illustrations?.map((i) => i.key) ?? [];
            }),
        ].filter((key): key is string => Boolean(key));

        if (keys.length > 0) {
            const { requested, deleted } = await this.storage.deleteMany(keys);
            const auditLine = `Story ${id} deletion: expected=${requested} deleted=${deleted}`;
            if (deleted < requested) this.logger.warn(auditLine);
            else this.logger.log(auditLine);
        }

        await this.prisma.story.delete({ where: { id } });
    }

    /** Paginated moderation list across all users, newest first, optional text search. */
    async findAllForAdmin(
        search: string | undefined,
        page: number,
        pageSize: number,
    ): Promise<IAdminStoryListPage> {
        const where: Prisma.StoryWhereInput = search
            ? {
                  OR: [
                      { title: { contains: search, mode: 'insensitive' } },
                      { question: { contains: search, mode: 'insensitive' } },
                      { user: { email: { contains: search, mode: 'insensitive' } } },
                  ],
              }
            : {};

        const [rows, total] = await this.prisma.$transaction([
            this.prisma.story.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    child: { select: { name: true } },
                    artStyle: { select: { name: true } },
                },
            }),
            this.prisma.story.count({ where }),
        ]);

        const items = await Promise.all(rows.map((row) => this.toAdminSummary(row)));
        return { items, total, page, pageSize };
    }

    private async toAdminSummary(story: StoryWithOwner): Promise<IAdminStorySummary> {
        return {
            id: story.id,
            title: story.title,
            question: story.question,
            type: story.type,
            status: story.status,
            isPublic: story.isPublic,
            pageCount: story.pageCount,
            createdAt: story.createdAt,
            coverImageUrl: story.coverImageKey
                ? await this.storage.getSignedUrl(story.coverImageKey)
                : null,
            owner: story.user,
            childName: story.child.name,
            artStyleName: story.artStyle.name,
        };
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
                watermark: await this.quotaService.getWatermarkForUser(story.userId),
            },
        );
    }

    // --- private helpers ---

    private async toSummary(story: StoryWithRelations): Promise<IStorySummary> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { coverImageKey, pdfKey: _pdfKey, ratings, artStyle, ...rest } = story;

        return {
            ...rest,
            artStyle: await this.toArtStyleEmbed(artStyle),
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            rating: ratings[0]?.score ?? null,
        };
    }

    private async toArtStyleEmbed(
        artStyle: StoryWithRelations['artStyle'],
    ): Promise<IStoryArtStyle> {
        const { thumbnailKey, ...rest } = artStyle;
        return {
            ...rest,
            thumbnailUrl: thumbnailKey ? await this.storage.getSignedUrl(thumbnailKey) : null,
        };
    }

    private async toDetail(story: StoryWithRelationsAndPages): Promise<IStoryDetail> {
        const { coverImageKey, pdfKey, pages, ratings, artStyle, ...rest } = story;

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

        const rating = ratings[0] ?? null;

        return {
            ...rest,
            artStyle: await this.toArtStyleEmbed(artStyle),
            pages: resolvedPages,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            pdfUrl: pdfKey ? await this.storage.getSignedUrl(pdfKey) : null,
            rating: rating?.score ?? null,
            myRating: rating ? { score: rating.score, comment: rating.comment } : null,
        };
    }
}

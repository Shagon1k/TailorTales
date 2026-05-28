import { Injectable, NotFoundException } from '@nestjs/common';
import type { ArtStyle, Child, Page, Story } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
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
        return this.prisma.story.create({
            data: {
                userId,
                childId: dto.childId,
                type: dto.type,
                question: dto.question,
                pageCount: dto.pageCount,
                artStyleId: dto.artStyleId,
                language: dto.language,
                ...(dto.blueprintId && { blueprintId: dto.blueprintId }),
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
        const { coverImageKey, pdfKey, ...rest } = story;

        return {
            ...rest,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            pdfUrl: pdfKey ? await this.storage.getSignedUrl(pdfKey) : null,
        };
    }
}

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { ArtStyle, Child, Story } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { PdfRendererService } from '../../rendering/pdf-renderer.service.js';
import { QuotaService } from '../../subscriptions/quota.service.js';
import { StoriesService } from '../stories.service.js';
import type { CreateStoryDto } from '../dto/create-story.dto.js';

const MOCK_CHILD: Pick<Child, 'id' | 'name' | 'birthdate'> = {
    id: 'child-1',
    name: 'Maya',
    birthdate: new Date('2020-03-10'),
};

const MOCK_ART_STYLE: Pick<ArtStyle, 'id' | 'name' | 'slug' | 'thumbnailKey'> = {
    id: 'style-1',
    name: 'Storybook',
    slug: 'storybook',
    thumbnailKey: null,
};

const MOCK_STORY: Story = {
    id: 'story-1',
    userId: 'user-123',
    childId: 'child-1',
    type: 'BOOK',
    status: 'DRAFT',
    blueprintId: null,
    question: 'Why is the sky blue?',
    pageCount: 8,
    artStyleId: 'style-1',
    language: 'EN',
    title: null,
    styleAnchor: null,
    characterId: null,
    isPublic: false,
    coverImageKey: null,
    pdfKey: null,
    createdAt: new Date('2026-05-01T10:00:00Z'),
    updatedAt: new Date('2026-05-01T10:00:00Z'),
};

const MOCK_STORY_WITH_RELATIONS = {
    ...MOCK_STORY,
    child: MOCK_CHILD,
    artStyle: MOCK_ART_STYLE,
    ratings: [],
};

const MOCK_STORY_WITH_PAGES = {
    ...MOCK_STORY_WITH_RELATIONS,
    pages: [],
};

describe('StoriesService', () => {
    let service: StoriesService;
    let storyFindMany: ReturnType<typeof vi.fn>;
    let storyFindFirst: ReturnType<typeof vi.fn>;
    let storyCreate: ReturnType<typeof vi.fn>;
    let storyDelete: ReturnType<typeof vi.fn>;
    let getSignedUrl: ReturnType<typeof vi.fn>;
    let storageDeleteMany: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        storyFindMany = vi.fn();
        storyFindFirst = vi.fn();
        storyCreate = vi.fn();
        storyDelete = vi.fn();
        getSignedUrl = vi.fn();
        storageDeleteMany = vi.fn().mockResolvedValue({ requested: 3, deleted: 3 });

        const module = await Test.createTestingModule({
            providers: [
                StoriesService,
                {
                    provide: PrismaService,
                    useValue: {
                        story: {
                            findMany: storyFindMany,
                            findFirst: storyFindFirst,
                            create: storyCreate,
                            delete: storyDelete,
                        },
                    },
                },
                {
                    provide: StorageService,
                    useValue: { getSignedUrl, deleteMany: storageDeleteMany },
                },
                {
                    provide: PdfRendererService,
                    useValue: { buildPageHtml: vi.fn() },
                },
                {
                    provide: QuotaService,
                    useValue: { getWatermarkForUser: vi.fn().mockResolvedValue(true) },
                },
            ],
        }).compile();

        service = module.get(StoriesService);
    });

    describe('findAllByUser', () => {
        it('should return summaries for all stories belonging to the user', async () => {
            storyFindMany.mockResolvedValue([MOCK_STORY_WITH_RELATIONS]);

            const result = await service.findAllByUser('user-123');

            expect(storyFindMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { userId: 'user-123' } }),
            );
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({ id: 'story-1', coverImageUrl: null });
        });

        it('should return an empty array when the user has no stories', async () => {
            storyFindMany.mockResolvedValue([]);

            const result = await service.findAllByUser('user-123');

            expect(result).toEqual([]);
        });

        it('should resolve a signed URL when coverImageKey is present', async () => {
            const storyWithKey = {
                ...MOCK_STORY_WITH_RELATIONS,
                coverImageKey: 'covers/story-1.jpg',
            };
            storyFindMany.mockResolvedValue([storyWithKey]);
            getSignedUrl.mockResolvedValue('https://cdn.example.com/signed-url');

            const result = await service.findAllByUser('user-123');

            expect(getSignedUrl).toHaveBeenCalledWith('covers/story-1.jpg');
            expect(result[0].coverImageUrl).toBe('https://cdn.example.com/signed-url');
        });
    });

    describe('findOneByUser', () => {
        it('should return the story detail when id and userId match', async () => {
            storyFindFirst.mockResolvedValue(MOCK_STORY_WITH_PAGES);

            const result = await service.findOneByUser('story-1', 'user-123');

            expect(storyFindFirst).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'story-1', userId: 'user-123' } }),
            );
            expect(result).toMatchObject({ id: 'story-1', pdfUrl: null, coverImageUrl: null });
        });

        it('should throw NotFoundException when the story does not exist', async () => {
            storyFindFirst.mockResolvedValue(null);

            await expect(service.findOneByUser('unknown', 'user-123')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException when the story belongs to a different user', async () => {
            storyFindFirst.mockResolvedValue(null);

            await expect(service.findOneByUser('story-1', 'other-user')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findPublic', () => {
        it('should return only COMPLETED public stories', async () => {
            storyFindMany.mockResolvedValue([MOCK_STORY_WITH_RELATIONS]);

            await service.findPublic();

            expect(storyFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isPublic: true, status: 'COMPLETED' },
                }),
            );
        });
    });

    describe('create', () => {
        it('should create a story with the provided fields and no blueprintId', async () => {
            storyCreate.mockResolvedValue(MOCK_STORY);
            const dto: CreateStoryDto = {
                childId: 'child-1',
                type: 'BOOK',
                question: 'Why is the sky blue?',
                pageCount: 8,
                artStyleId: 'style-1',
                language: 'EN',
            };

            const result = await service.create('user-123', dto);

            expect(storyCreate).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    childId: 'child-1',
                    type: 'BOOK',
                    question: 'Why is the sky blue?',
                    pageCount: 8,
                    artStyleId: 'style-1',
                    language: 'EN',
                },
            });
            expect(result).toBe(MOCK_STORY);
        });
    });

    describe('remove', () => {
        it('should delete the story when the user owns it', async () => {
            storyFindFirst.mockResolvedValue({ ...MOCK_STORY, pages: [] });
            storyDelete.mockResolvedValue(MOCK_STORY);

            await service.remove('story-1', 'user-123');

            expect(storyDelete).toHaveBeenCalledWith({ where: { id: 'story-1' } });
            // DRAFT story with no assets — no S3 calls
            expect(storageDeleteMany).not.toHaveBeenCalled();
        });

        it('should delete S3 assets (pdf, cover, illustrations) before the DB row', async () => {
            storyFindFirst.mockResolvedValue({
                ...MOCK_STORY,
                pdfKey: 'users/user-123/stories/story-1/story.pdf',
                coverImageKey: 'users/user-123/stories/story-1/cover',
                pages: [{ illustrations: [{ key: 'users/user-123/stories/story-1/pages/1' }] }],
            });
            storyDelete.mockResolvedValue(MOCK_STORY);

            await service.remove('story-1', 'user-123');

            expect(storageDeleteMany).toHaveBeenCalledWith([
                'users/user-123/stories/story-1/story.pdf',
                'users/user-123/stories/story-1/cover',
                'users/user-123/stories/story-1/pages/1',
            ]);
            expect(storyDelete).toHaveBeenCalledWith({ where: { id: 'story-1' } });
        });

        it('should throw NotFoundException when the story belongs to a different user', async () => {
            storyFindFirst.mockResolvedValue(null);

            await expect(service.remove('story-1', 'other-user')).rejects.toThrow(
                NotFoundException,
            );
            expect(storyDelete).not.toHaveBeenCalled();
        });
    });
});

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
    genre: null,
    writingStyle: null,
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
    let storyFindUnique: ReturnType<typeof vi.fn>;
    let storyCreate: ReturnType<typeof vi.fn>;
    let storyDelete: ReturnType<typeof vi.fn>;
    let storyCount: ReturnType<typeof vi.fn>;
    let characterFindFirst: ReturnType<typeof vi.fn>;
    let getSignedUrl: ReturnType<typeof vi.fn>;
    let storageDeleteMany: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        storyFindMany = vi.fn();
        storyFindFirst = vi.fn();
        storyFindUnique = vi.fn();
        storyCreate = vi.fn();
        storyDelete = vi.fn();
        storyCount = vi.fn();
        characterFindFirst = vi.fn();
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
                            findUnique: storyFindUnique,
                            create: storyCreate,
                            delete: storyDelete,
                            count: storyCount,
                        },
                        character: { findFirst: characterFindFirst },
                        $transaction: (ops: Promise<unknown>[]) => Promise.all(ops),
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

        describe('given a chosen characterId', () => {
            const dtoWithCharacter: CreateStoryDto = {
                childId: 'child-1',
                characterId: 'char-1',
                type: 'BOOK',
                question: 'Why is the sky blue?',
                pageCount: 8,
                artStyleId: 'style-1',
                language: 'EN',
            };

            it('should set characterId when the character belongs to the user', async () => {
                characterFindFirst.mockResolvedValue({ id: 'char-1' });
                storyCreate.mockResolvedValue(MOCK_STORY);

                await service.create('user-123', dtoWithCharacter);

                expect(characterFindFirst).toHaveBeenCalledWith({
                    where: { id: 'char-1', userId: 'user-123', childId: 'child-1' },
                    select: { id: true },
                });
                expect(storyCreate).toHaveBeenCalledWith({
                    data: expect.objectContaining({ characterId: 'char-1' }),
                });
            });

            it('should throw NotFoundException when the character is not owned by the user', async () => {
                characterFindFirst.mockResolvedValue(null);

                await expect(service.create('user-123', dtoWithCharacter)).rejects.toThrow(
                    NotFoundException,
                );
                expect(storyCreate).not.toHaveBeenCalled();
            });
        });

        describe('given genre and writing style', () => {
            it('should persist them on the story', async () => {
                storyCreate.mockResolvedValue(MOCK_STORY);
                const dto: CreateStoryDto = {
                    childId: 'child-1',
                    type: 'BOOK',
                    question: 'Why is the sky blue?',
                    pageCount: 8,
                    artStyleId: 'style-1',
                    language: 'EN',
                    genre: 'BEDTIME',
                    writingStyle: 'POETIC',
                };

                await service.create('user-123', dto);

                expect(storyCreate).toHaveBeenCalledWith({
                    data: expect.objectContaining({ genre: 'BEDTIME', writingStyle: 'POETIC' }),
                });
            });
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

    describe('removeAsAdmin', () => {
        it('should delete any story by id without an ownership scope', async () => {
            storyFindUnique.mockResolvedValue({ ...MOCK_STORY, pages: [] });
            storyDelete.mockResolvedValue(MOCK_STORY);

            await service.removeAsAdmin('story-1');

            expect(storyFindUnique).toHaveBeenCalledWith(
                expect.objectContaining({ where: { id: 'story-1' } }),
            );
            expect(storyDelete).toHaveBeenCalledWith({ where: { id: 'story-1' } });
        });

        it('should throw NotFoundException when the story does not exist', async () => {
            storyFindUnique.mockResolvedValue(null);

            await expect(service.removeAsAdmin('ghost')).rejects.toThrow(NotFoundException);
            expect(storyDelete).not.toHaveBeenCalled();
        });
    });

    describe('findAllForAdmin', () => {
        const adminRow = {
            ...MOCK_STORY,
            user: { id: 'user-123', name: 'Owner', email: 'owner@b.com' },
            child: { name: 'Maya' },
            artStyle: { name: 'Storybook' },
        };

        it('should map rows to admin summaries with owner context', async () => {
            storyFindMany.mockResolvedValue([adminRow]);
            storyCount.mockResolvedValue(1);

            const result = await service.findAllForAdmin(undefined, 1, 20);

            expect(result.total).toBe(1);
            expect(result.items[0]).toMatchObject({
                id: 'story-1',
                owner: { email: 'owner@b.com' },
                childName: 'Maya',
                artStyleName: 'Storybook',
            });
        });

        it('should search across title, question, and owner email', async () => {
            storyFindMany.mockResolvedValue([]);
            storyCount.mockResolvedValue(0);

            await service.findAllForAdmin('sky', 1, 20);

            expect(storyFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { title: { contains: 'sky', mode: 'insensitive' } },
                            { question: { contains: 'sky', mode: 'insensitive' } },
                            { user: { email: { contains: 'sky', mode: 'insensitive' } } },
                        ],
                    },
                }),
            );
        });

        it('should apply pagination via skip/take', async () => {
            storyFindMany.mockResolvedValue([]);
            storyCount.mockResolvedValue(0);

            await service.findAllForAdmin(undefined, 2, 10);

            expect(storyFindMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 10, take: 10 }),
            );
        });
    });
});

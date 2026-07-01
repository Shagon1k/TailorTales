import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { GenerationService } from '../../generation/generation.service.js';
import { RatingsService } from '../../ratings/ratings.service.js';
import { RegenerationService } from '../../regeneration/regeneration.service.js';
import { StoriesController } from '../stories.controller.js';
import { StoriesService } from '../stories.service.js';
import {
    ALLOWED_PAGE_COUNTS,
    QUESTION_SUGGESTIONS,
    STORY_QUESTION_MAX_LENGTH,
    STORY_QUESTION_MIN_LENGTH,
} from '../stories.constants.js';
import type { IPublicStorySummary, IStoryDetail, IStorySummary } from '../stories.types.js';

const MOCK_USER: User = {
    id: 'user-123',
    googleId: 'google-abc',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    avatarKey: null,
    notificationPreferences: null,
    role: 'USER',
    suspendedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const MOCK_SUMMARY: IStorySummary = {
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
    createdAt: new Date('2026-05-01T10:00:00Z'),
    updatedAt: new Date('2026-05-01T10:00:00Z'),
    child: { id: 'child-1', name: 'Maya', birthdate: new Date('2020-03-10') },
    artStyle: {
        id: 'style-1',
        name: 'Storybook',
        slug: 'storybook',
        thumbnailUrl: 'https://example.com/thumb.jpg',
    },
    coverImageUrl: null,
    rating: null,
};

const MOCK_DETAIL: IStoryDetail = { ...MOCK_SUMMARY, pages: [], pdfUrl: null, myRating: null };
const MOCK_PUBLIC_SUMMARY: IPublicStorySummary = {
    id: 'story-1',
    type: 'BOOK',
    question: 'Why is the sky blue?',
    pageCount: 8,
    language: 'EN',
    genre: null,
    writingStyle: null,
    title: null,
    rating: 5,
    readerAge: 6,
    hasCharacter: false,
    artStyle: {
        id: 'style-1',
        name: 'Storybook',
        slug: 'storybook',
        thumbnailUrl: 'https://example.com/thumb.jpg',
    },
    coverImageUrl: null,
    pdfUrl: 'https://example.com/story.pdf',
};

describe('StoriesController', () => {
    let controller: StoriesController;
    let findPublic: ReturnType<typeof vi.fn>;
    let findAllByUser: ReturnType<typeof vi.fn>;
    let findOneByUser: ReturnType<typeof vi.fn>;
    let create: ReturnType<typeof vi.fn>;
    let retry: ReturnType<typeof vi.fn>;
    let remove: ReturnType<typeof vi.fn>;
    let setPublicVisibility: ReturnType<typeof vi.fn>;
    let upsertRating: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        findPublic = vi.fn();
        findAllByUser = vi.fn();
        findOneByUser = vi.fn();
        create = vi.fn();
        retry = vi.fn();
        remove = vi.fn();
        setPublicVisibility = vi.fn();
        upsertRating = vi.fn();

        const module = await Test.createTestingModule({
            controllers: [StoriesController],
            providers: [
                {
                    provide: StoriesService,
                    useValue: {
                        findPublic,
                        findAllByUser,
                        findOneByUser,
                        create,
                        retry,
                        remove,
                        setPublicVisibility,
                    },
                },
                {
                    provide: GenerationService,
                    useValue: {
                        enqueue: vi.fn().mockResolvedValue({ jobId: 'job-1', storyId: 'story-1' }),
                    },
                },
                {
                    provide: RegenerationService,
                    useValue: { regeneratePage: vi.fn() },
                },
                {
                    provide: RatingsService,
                    useValue: { upsert: upsertRating },
                },
            ],
        }).compile();

        controller = module.get(StoriesController);
    });

    describe('findPublic', () => {
        it('should return public stories without requiring authentication', async () => {
            findPublic.mockResolvedValue([MOCK_PUBLIC_SUMMARY]);

            const result = await controller.findPublic();

            expect(findPublic).toHaveBeenCalledTimes(1);
            expect(result).toEqual([MOCK_PUBLIC_SUMMARY]);
        });
    });

    describe('getConfig', () => {
        // getConfig reads directly from constants — no service call involved.

        it('should return the allowed page counts from constants', () => {
            const { allowedPageCounts } = controller.getConfig();

            expect(allowedPageCounts).toEqual(ALLOWED_PAGE_COUNTS);
        });

        it('should return correct question length constraints', () => {
            const { questionMinLength, questionMaxLength } = controller.getConfig();

            expect(questionMinLength).toBe(STORY_QUESTION_MIN_LENGTH);
            expect(questionMaxLength).toBe(STORY_QUESTION_MAX_LENGTH);
            expect(questionMinLength).toBeGreaterThan(0);
            expect(questionMaxLength).toBeGreaterThan(questionMinLength);
        });

        it('should return the question suggestions from constants', () => {
            const { questionSuggestions } = controller.getConfig();

            expect(questionSuggestions).toEqual(QUESTION_SUGGESTIONS);
            expect(questionSuggestions.length).toBeGreaterThan(0);
        });
    });

    describe('findAll', () => {
        it('should return all stories for the current user', async () => {
            findAllByUser.mockResolvedValue([MOCK_SUMMARY]);

            const result = await controller.findAll(MOCK_USER);

            expect(findAllByUser).toHaveBeenCalledWith('user-123');
            expect(result).toEqual([MOCK_SUMMARY]);
        });
    });

    describe('findOne', () => {
        it('should return the story scoped to the current user', async () => {
            findOneByUser.mockResolvedValue(MOCK_DETAIL);

            const result = await controller.findOne('story-1', MOCK_USER);

            expect(findOneByUser).toHaveBeenCalledWith('story-1', 'user-123');
            expect(result).toBe(MOCK_DETAIL);
        });
    });

    describe('create', () => {
        it('should create a story for the current user', async () => {
            create.mockResolvedValue(MOCK_SUMMARY);
            const dto = {
                childId: 'child-1',
                type: 'BOOK' as const,
                question: 'Why is the sky blue?',
                pageCount: 8,
                artStyleId: 'style-1',
                language: 'EN' as const,
            };

            const result = await controller.create(MOCK_USER, dto);

            expect(create).toHaveBeenCalledWith('user-123', dto);
            expect(result).toBe(MOCK_SUMMARY);
        });
    });

    describe('remove', () => {
        it('should delete the story scoped to the current user', async () => {
            remove.mockResolvedValue(undefined);

            await controller.remove('story-1', MOCK_USER);

            expect(remove).toHaveBeenCalledWith('story-1', 'user-123');
        });
    });

    describe('retry', () => {
        it('should reset the failed story and enqueue generation for the same story id', async () => {
            retry.mockResolvedValue(undefined);
            const dto = {
                childId: 'child-1',
                type: 'BOOK' as const,
                question: 'Why is the sky blue?',
                pageCount: 8,
                artStyleId: 'style-1',
                language: 'EN' as const,
            };

            const result = await controller.retry('story-1', MOCK_USER, dto);

            expect(retry).toHaveBeenCalledWith('story-1', 'user-123', dto);
            expect(result).toEqual({ jobId: 'job-1', storyId: 'story-1' });
        });
    });

    describe('rate', () => {
        it('should upsert the rating for the current user and story', async () => {
            const dto = { score: 5, comment: 'Loved it', isPublic: true };
            const rating = { id: 'rating-1', storyId: 'story-1', userId: 'user-123', ...dto };
            upsertRating.mockResolvedValue(rating);

            const result = await controller.rate('story-1', MOCK_USER, dto);

            expect(upsertRating).toHaveBeenCalledWith('story-1', 'user-123', dto);
            expect(result).toBe(rating);
        });
    });

    describe('setVisibility', () => {
        it('should delegate to the service to override public visibility', async () => {
            setPublicVisibility.mockResolvedValue(undefined);

            await controller.setVisibility('story-1', { isPublic: false });

            expect(setPublicVisibility).toHaveBeenCalledWith('story-1', false);
        });
    });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RatingsService } from '../ratings.service.js';

const STORY_ID = 'story-1';
const USER_ID = 'user-1';

function buildPrismaMock() {
    return {
        story: {
            findFirst: vi.fn().mockResolvedValue({ status: 'COMPLETED' }),
            update: vi.fn().mockResolvedValue({}),
        },
        rating: {
            upsert: vi.fn().mockResolvedValue({ id: 'rating-1', score: 5 }),
            findMany: vi.fn().mockResolvedValue([]),
        },
        $transaction: vi.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
}

describe('RatingsService', () => {
    let service: RatingsService;
    let prisma: ReturnType<typeof buildPrismaMock>;

    beforeEach(async () => {
        prisma = buildPrismaMock();
        const module = await Test.createTestingModule({
            providers: [RatingsService, { provide: PrismaService, useValue: prisma }],
        }).compile();
        service = module.get(RatingsService);
    });

    describe('upsert', () => {
        it('should throw NotFoundException when the story is missing or not owned', async () => {
            prisma.story.findFirst.mockResolvedValue(null);

            await expect(service.upsert(STORY_ID, USER_ID, { score: 5 })).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should scope the ownership lookup to { id, userId }', async () => {
            await service.upsert(STORY_ID, USER_ID, { score: 4 });

            expect(prisma.story.findFirst).toHaveBeenCalledWith({
                where: { id: STORY_ID, userId: USER_ID },
                select: { status: true },
            });
        });

        it('should throw BadRequestException when the story is not COMPLETED', async () => {
            prisma.story.findFirst.mockResolvedValue({ status: 'GENERATING' });

            await expect(service.upsert(STORY_ID, USER_ID, { score: 5 })).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should use the localization error code for the not-completed message', async () => {
            prisma.story.findFirst.mockResolvedValue({ status: 'GENERATING' });

            const err = await service.upsert(STORY_ID, USER_ID, { score: 5 }).catch((e) => e);
            expect((err as BadRequestException).getResponse()).toMatchObject({
                message: 'errors.ratings.storyNotCompleted',
            });
        });

        it('should upsert the rating by the storyId_userId compound key', async () => {
            await service.upsert(STORY_ID, USER_ID, { score: 3, comment: 'nice' });

            expect(prisma.rating.upsert).toHaveBeenCalledWith({
                where: { storyId_userId: { storyId: STORY_ID, userId: USER_ID } },
                create: { storyId: STORY_ID, userId: USER_ID, score: 3, comment: 'nice' },
                update: { score: 3, comment: 'nice' },
            });
        });

        it('should mirror the isPublic toggle onto the story when provided', async () => {
            await service.upsert(STORY_ID, USER_ID, { score: 5, isPublic: true });

            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: STORY_ID },
                data: { isPublic: true },
            });
        });

        it('should keep a shared story private when the rating is below 4', async () => {
            await service.upsert(STORY_ID, USER_ID, { score: 3, isPublic: true });

            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: STORY_ID },
                data: { isPublic: false },
            });
        });

        it('should retract visibility when isPublic is false', async () => {
            await service.upsert(STORY_ID, USER_ID, { score: 5, isPublic: false });

            expect(prisma.story.update).toHaveBeenCalledWith({
                where: { id: STORY_ID },
                data: { isPublic: false },
            });
        });

        it('should leave visibility untouched when isPublic is omitted', async () => {
            await service.upsert(STORY_ID, USER_ID, { score: 5 });

            expect(prisma.story.update).not.toHaveBeenCalled();
        });
    });

    describe('findAllForAdmin', () => {
        it('should list every rating with story + author context, newest first', async () => {
            await service.findAllForAdmin();

            expect(prisma.rating.findMany).toHaveBeenCalledWith({
                include: {
                    story: { select: { id: true, title: true, question: true, isPublic: true } },
                    user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
    });
});

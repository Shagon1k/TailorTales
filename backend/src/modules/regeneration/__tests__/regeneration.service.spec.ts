import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RegenerationService } from '../regeneration.service.js';
import { FREE_TIER_REGENERATION_LIMIT } from '../regeneration.constants.js';

const STORY_ID = 'story-1';
const USER_ID = 'user-1';
const PAGE_ID = 'page-1';
const NOW = new Date('2026-06-10T12:00:00.000Z');

const mockStory = {
    id: STORY_ID,
    userId: USER_ID,
    childId: 'child-1',
    type: 'BOOK',
    status: 'COMPLETED',
    blueprintId: null,
    question: 'Why does the moon follow me?',
    pageCount: 5,
    artStyleId: 'style-1',
    language: 'EN',
    title: 'Moon Walk',
    styleAnchor: 'STYLE ANCHOR: soft watercolor, consistent blue scarf.',
    characterId: 'character-1',
    isPublic: false,
    coverImageKey: null,
    pdfKey: 'users/user-1/stories/story-1/story.pdf',
    createdAt: NOW,
    updatedAt: NOW,
    child: { name: 'Maya' },
};

const mockPage = {
    id: PAGE_ID,
    storyId: STORY_ID,
    order: 2,
    chapterTitle: 'Moon Questions',
    text: 'Maya waved at the moon.',
    illustrations: [{ key: 'users/user-1/stories/story-1/pages/2', position: 'main' }],
    layout: 'book-text-image',
    illustrationPrompt: 'Maya in pajamas waves to the moon from her window.',
};

function createPrismaMock(userQuota = {}) {
    const user = {
        regenerationsInWindow: 0,
        regenerationWindowStartedAt: NOW,
        ...userQuota,
    };

    const prisma = {
        story: {
            findFirst: vi.fn().mockResolvedValue(mockStory),
            update: vi.fn().mockResolvedValue({}),
        },
        page: {
            findUnique: vi.fn().mockResolvedValue(mockPage),
            findMany: vi.fn().mockResolvedValue([mockPage]),
            update: vi.fn().mockResolvedValue({}),
        },
        user: {
            findUnique: vi.fn().mockResolvedValue(user),
            update: vi.fn().mockResolvedValue({}),
        },
        job: {
            create: vi.fn().mockResolvedValue({}),
        },
        $transaction: vi.fn(async (callback: (tx: typeof prisma) => Promise<unknown>) =>
            callback(prisma),
        ),
    };

    return prisma;
}

function createService(prisma = createPrismaMock()) {
    const storage = {
        upload: vi.fn().mockResolvedValue('uploaded-key'),
        getSignedUrl: vi.fn().mockResolvedValue('https://storage.test/page.png'),
    };
    const pdfBinding = {
        buildAndStore: vi.fn().mockResolvedValue(undefined),
    };
    const ai = {
        generateStoryPlan: vi.fn(),
        generatePageText: vi.fn().mockResolvedValue('Maya smiled.'),
        generateImage: vi.fn().mockResolvedValue(Buffer.from('image')),
        moderateText: vi.fn(),
    };

    return {
        service: new RegenerationService(
            prisma as never,
            storage as never,
            pdfBinding as never,
            ai,
        ),
        prisma,
        storage,
        pdfBinding,
        ai,
    };
}

describe('RegenerationService', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('retries text regeneration once when the first result is incomplete', async () => {
        const { service, prisma, ai } = createService();
        ai.generatePageText
            .mockResolvedValueOnce('Maya looked up at the')
            .mockResolvedValueOnce('Maya looked up at the bright moon.');

        await service.regeneratePage(STORY_ID, 2, USER_ID, {
            what: 'text',
            prompt: 'Make it more curious.',
        });

        expect(ai.generatePageText).toHaveBeenCalledTimes(2);
        expect(ai.generatePageText.mock.calls[0][0].userPrompt).toContain(
            "Author's note: Make it more curious.",
        );
        expect(prisma.page.update).toHaveBeenCalledWith({
            where: { id: PAGE_ID },
            data: { text: 'Maya looked up at the bright moon.' },
        });
    });

    it('uses the story styleAnchor when regenerating an illustration', async () => {
        const { service, ai } = createService();

        await service.regeneratePage(STORY_ID, 2, USER_ID, {
            what: 'illustration',
            prompt: 'Make the moon look friendlier.',
        });

        expect(ai.generateImage).toHaveBeenCalledWith({
            prompt: expect.stringContaining(mockStory.styleAnchor),
            size: expect.any(String),
        });
        expect(ai.generateImage.mock.calls[0][0].prompt).toContain(mockPage.illustrationPrompt);
        expect(ai.generateImage.mock.calls[0][0].prompt).toContain(
            'Requested change: Make the moon look friendlier.',
        );
    });

    it('creates a COMPLETED regeneration job and consumes quota only after success', async () => {
        const { service, prisma, pdfBinding } = createService();

        await service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { regenerationsInWindow: { increment: 1 } },
        });
        expect(prisma.job.create).toHaveBeenCalledWith({
            data: { storyId: STORY_ID, type: 'REGENERATION', status: 'COMPLETED' },
        });
        // PDF re-stitch is delegated to PdfBindingService
        expect(pdfBinding.buildAndStore).toHaveBeenCalledWith(
            expect.objectContaining({ id: STORY_ID }),
            expect.any(Array),
        );
    });

    it('throws at the quota boundary before doing AI work', async () => {
        const prisma = createPrismaMock({
            regenerationsInWindow: FREE_TIER_REGENERATION_LIMIT,
            regenerationWindowStartedAt: NOW,
        });
        const { service, ai } = createService(prisma);

        await expect(
            service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' }),
        ).rejects.toBeInstanceOf(ForbiddenException);

        expect(ai.generatePageText).not.toHaveBeenCalled();
        expect(prisma.job.create).not.toHaveBeenCalled();
    });

    it('starts a fresh quota window on successful regeneration after rollover', async () => {
        const oldWindowStart = new Date('2026-05-01T12:00:00.000Z');
        const prisma = createPrismaMock({
            regenerationsInWindow: FREE_TIER_REGENERATION_LIMIT,
            regenerationWindowStartedAt: oldWindowStart,
        });
        const { service } = createService(prisma);

        await service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' });

        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: USER_ID },
            data: { regenerationsInWindow: 1, regenerationWindowStartedAt: NOW },
        });
    });

    it('does not create a job or consume quota when regeneration fails', async () => {
        const { service, prisma, ai } = createService();
        ai.generatePageText.mockRejectedValue(new Error('AI unavailable'));

        await expect(
            service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' }),
        ).rejects.toThrow('AI unavailable');

        expect(prisma.user.update).not.toHaveBeenCalled();
        expect(prisma.job.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the story does not exist or belong to the user', async () => {
        const prisma = createPrismaMock();
        prisma.story.findFirst.mockResolvedValue(null);
        const { service } = createService(prisma);

        await expect(
            service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' }),
        ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when the story is not COMPLETED', async () => {
        const prisma = createPrismaMock();
        prisma.story.findFirst.mockResolvedValue({ ...mockStory, status: 'GENERATING' });
        const { service } = createService(prisma);

        await expect(
            service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' }),
        ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the page does not exist', async () => {
        const prisma = createPrismaMock();
        prisma.page.findUnique.mockResolvedValue(null);
        const { service } = createService(prisma);

        await expect(
            service.regeneratePage(STORY_ID, 99, USER_ID, { what: 'text' }),
        ).rejects.toThrow(NotFoundException);
    });

    it('regenerates both text and illustration for what: both', async () => {
        const { service, ai, prisma, storage, pdfBinding } = createService();

        await service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'both' });

        expect(ai.generatePageText).toHaveBeenCalledTimes(1);
        expect(ai.generateImage).toHaveBeenCalledTimes(1);
        expect(prisma.page.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ text: expect.any(String) }),
            }),
        );
        expect(storage.upload).toHaveBeenCalled();
        expect(pdfBinding.buildAndStore).toHaveBeenCalled();
    });

    it('throws when text is still incomplete after the retry', async () => {
        const { service, ai } = createService();
        ai.generatePageText.mockResolvedValue('Maya looked up at the'); // no terminal punctuation

        await expect(
            service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'text' }),
        ).rejects.toThrow(/complete sentence after retry/i);

        expect(ai.generatePageText).toHaveBeenCalledTimes(2);
    });

    it('throws BadRequestException when the page has no illustration prompt stored', async () => {
        const prisma = createPrismaMock();
        prisma.page.findUnique.mockResolvedValue({ ...mockPage, illustrationPrompt: null });
        const { service } = createService(prisma);

        await expect(
            service.regeneratePage(STORY_ID, 2, USER_ID, { what: 'illustration' }),
        ).rejects.toThrow(BadRequestException);
    });
});

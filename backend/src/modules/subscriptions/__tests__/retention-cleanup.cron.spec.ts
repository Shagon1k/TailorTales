import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { RetentionCleanupCron } from '../retention-cleanup.cron.js';

const NOW = new Date('2026-06-11T12:00:00.000Z');
const DAYS_40_AGO = new Date('2026-05-02T12:00:00.000Z');
const DAYS_5_AGO = new Date('2026-06-06T12:00:00.000Z');

function buildStory(overrides: Record<string, unknown> = {}) {
    return {
        id: 'story-1',
        status: 'COMPLETED',
        pdfKey: 'users/u1/stories/story-1/story.pdf',
        coverImageKey: 'users/u1/stories/story-1/cover',
        updatedAt: DAYS_40_AGO,
        pages: [
            { id: 'page-1', illustrations: [{ key: 'users/u1/stories/story-1/pages/1' }] },
            { id: 'page-2', illustrations: [] },
        ],
        user: { subscription: { pricingTier: { retentionDays: 30 } } },
        ...overrides,
    };
}

describe('RetentionCleanupCron', () => {
    let cron: RetentionCleanupCron;
    let storyFindMany: ReturnType<typeof vi.fn>;
    let storyUpdate: ReturnType<typeof vi.fn>;
    let pageUpdateMany: ReturnType<typeof vi.fn>;
    let storageDelete: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);

        storyFindMany = vi.fn().mockResolvedValue([]);
        storyUpdate = vi.fn().mockResolvedValue({});
        pageUpdateMany = vi.fn().mockResolvedValue({});
        storageDelete = vi.fn().mockResolvedValue(undefined);

        const module = await Test.createTestingModule({
            providers: [
                RetentionCleanupCron,
                {
                    provide: PrismaService,
                    useValue: {
                        story: { findMany: storyFindMany, update: storyUpdate },
                        page: { updateMany: pageUpdateMany },
                    },
                },
                {
                    provide: StorageService,
                    useValue: { delete: storageDelete },
                },
            ],
        }).compile();

        cron = module.get(RetentionCleanupCron);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should delete all asset keys and null the key columns for an expired story', async () => {
        storyFindMany.mockResolvedValue([buildStory()]);

        await cron.cleanupExpiredStories();

        expect(storageDelete).toHaveBeenCalledTimes(3); // pdf + cover + 1 illustration
        expect(storyUpdate).toHaveBeenCalledWith({
            where: { id: 'story-1' },
            data: { pdfKey: null, coverImageKey: null },
        });
        expect(pageUpdateMany).toHaveBeenCalledWith({
            where: { storyId: 'story-1' },
            data: { illustrations: [] },
        });
    });

    it('should skip stories still inside their retention window', async () => {
        storyFindMany.mockResolvedValue([buildStory({ updatedAt: DAYS_5_AGO })]);

        await cron.cleanupExpiredStories();

        expect(storageDelete).not.toHaveBeenCalled();
        expect(storyUpdate).not.toHaveBeenCalled();
    });

    it('should still null the keys when some S3 deletes fail (logged as expected vs actual)', async () => {
        storyFindMany.mockResolvedValue([buildStory()]);
        storageDelete
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(new Error('S3 down'))
            .mockResolvedValueOnce(undefined);

        await cron.cleanupExpiredStories();

        expect(storageDelete).toHaveBeenCalledTimes(3);
        expect(storyUpdate).toHaveBeenCalled();
    });

    it('should do nothing when no candidate stories exist', async () => {
        await cron.cleanupExpiredStories();

        expect(storageDelete).not.toHaveBeenCalled();
        expect(storyUpdate).not.toHaveBeenCalled();
    });
});

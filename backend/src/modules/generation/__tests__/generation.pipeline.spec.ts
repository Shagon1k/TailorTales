import { Test } from '@nestjs/testing';
import { GenerationPipeline } from '../generation.pipeline.js';
import { StoryPromptBuilder } from '../story-prompt-builder.js';
import { StoryPlanValidator } from '../story-plan.validator.js';
import { PdfBindingService } from '../../rendering/pdf-binding.service.js';
import { AI_CLIENT } from '../../ai/ai.types.js';
import { AiStubClient } from '../../ai/ai-stub.client.js';
import { NotificationEmitterService } from '../../notifications/notification-emitter.service.js';
import { QuotaService } from '../../subscriptions/quota.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';

const STORY_ID = 'story-1';
const USER_ID = 'user-1';
const JOB_ID = 'job-1';
const BLUEPRINT_ID = 'bp-1';

const mockStory = {
    id: STORY_ID,
    userId: USER_ID,
    childId: 'child-1',
    type: 'BOOK',
    status: 'QUEUED',
    blueprintId: null,
    question: 'Why do mountains breathe smoke?',
    pageCount: 5,
    artStyleId: 'style-1',
    language: 'EN',
    title: null,
    styleAnchor: null,
    isPublic: false,
    coverImageKey: null,
    pdfKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    child: { id: 'child-1', name: 'Maya', birthdate: new Date('2019-01-01'), interests: [] },
    artStyle: { id: 'style-1', name: 'Storybook', promptPrefix: 'Warm watercolour style.' },
};

const mockBlueprint = {
    id: BLUEPRINT_ID,
    name: 'Classic Book',
    description: 'A narrative book.',
    type: 'BOOK',
    systemPrompt: "You write warm children's books.",
    coverImageKey: null,
    previewPageKeys: [],
    createdById: USER_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
};

function buildMockPrisma() {
    const pages: unknown[] = [];

    return {
        job: {
            findUnique: vi.fn().mockResolvedValue({ id: JOB_ID, storyId: STORY_ID }),
            update: vi.fn().mockResolvedValue({}),
        },
        story: {
            findUnique: vi.fn().mockResolvedValue(mockStory),
            update: vi.fn().mockResolvedValue({}),
        },
        storyBlueprint: {
            findFirst: vi.fn().mockResolvedValue(mockBlueprint),
        },
        character: {
            findFirst: vi.fn().mockResolvedValue(null), // no character by default
        },
        page: {
            createMany: vi.fn().mockImplementation(({ data }: { data: unknown[] }) => {
                pages.push(...data.map((p, i) => ({ ...(p as object), id: `page-${i + 1}` })));
                return Promise.resolve({ count: data.length });
            }),
            findMany: vi.fn().mockImplementation(() =>
                Promise.resolve(
                    pages.map((p) => ({
                        ...(p as object),
                        illustrations: [],
                    })),
                ),
            ),
            update: vi.fn().mockResolvedValue({}),
        },
    };
}

const mockStorage = {
    upload: vi.fn().mockResolvedValue('mock-key'),
    getSignedUrl: vi.fn().mockResolvedValue('https://example.com/image.png'),
};

const mockPdfBinding = {
    buildAndStore: vi.fn().mockResolvedValue(undefined),
};

const mockNotifications = {
    storyCompleted: vi.fn().mockResolvedValue(undefined),
    storyFailed: vi.fn().mockResolvedValue(undefined),
};

const mockQuota = {
    deductPageCredits: vi.fn().mockResolvedValue(undefined),
};

describe('GenerationPipeline', () => {
    let pipeline: GenerationPipeline;
    let mockPrisma: ReturnType<typeof buildMockPrisma>;

    beforeEach(async () => {
        mockPrisma = buildMockPrisma();
        vi.clearAllMocks();

        const module = await Test.createTestingModule({
            providers: [
                GenerationPipeline,
                StoryPromptBuilder,
                StoryPlanValidator,
                AiStubClient,
                { provide: AI_CLIENT, useClass: AiStubClient },
                { provide: PrismaService, useValue: mockPrisma },
                { provide: StorageService, useValue: mockStorage },
                { provide: PdfBindingService, useValue: mockPdfBinding },
                { provide: NotificationEmitterService, useValue: mockNotifications },
                { provide: QuotaService, useValue: mockQuota },
            ],
        }).compile();

        pipeline = module.get(GenerationPipeline);
    });

    describe('given a valid BOOK story and stub AI', () => {
        it('should complete the full pipeline and update story to COMPLETED', async () => {
            await pipeline.run(JOB_ID);

            // Job marked COMPLETED
            expect(mockPrisma.job.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
            );

            // Story marked COMPLETED (pdfKey is set inside PdfBindingService.buildAndStore)
            expect(mockPrisma.story.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ status: 'COMPLETED' }),
                }),
            );

            // Pages created for story plan
            expect(mockPrisma.page.createMany).toHaveBeenCalled();

            // Page credits deducted on success only (Ready stage)
            expect(mockQuota.deductPageCredits).toHaveBeenCalledTimes(1);

            // PDF built and stored via shared service
            expect(mockPdfBinding.buildAndStore).toHaveBeenCalled();
        });
    });

    describe('given a structural error in the story plan', () => {
        it('should fail the job when repair retry also fails', async () => {
            // Make the stub return a plan with wrong page count to trigger structural error
            const stubClient = new AiStubClient();
            vi.spyOn(stubClient, 'generateStoryPlan').mockResolvedValue({
                title: 'Bad Plan',
                styleAnchor: 'Fox',
                pages: [
                    // Only 2 pages when 5 are expected — structural error
                    {
                        template: 'book-cover',
                        text: 'Cover',
                        chapterTitle: null,
                        illustration: { prompt: 'art' },
                    },
                    {
                        template: 'book-final',
                        text: 'End',
                        chapterTitle: null,
                        illustration: { prompt: 'art' },
                    },
                ],
            });

            const module = await Test.createTestingModule({
                providers: [
                    GenerationPipeline,
                    StoryPromptBuilder,
                    StoryPlanValidator,
                    { provide: AI_CLIENT, useValue: stubClient },
                    { provide: PrismaService, useValue: mockPrisma },
                    { provide: StorageService, useValue: mockStorage },
                    { provide: PdfBindingService, useValue: mockPdfBinding },
                    { provide: NotificationEmitterService, useValue: mockNotifications },
                    { provide: QuotaService, useValue: mockQuota },
                ],
            }).compile();

            const badPipeline = module.get(GenerationPipeline);

            await expect(badPipeline.run(JOB_ID)).rejects.toThrow(/structural validation failed/i);

            expect(mockPrisma.job.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
            );

            // FAILED stories never charge the user
            expect(mockQuota.deductPageCredits).not.toHaveBeenCalled();
        });
    });
});

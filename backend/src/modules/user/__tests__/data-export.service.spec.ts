import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { DataExportService } from '../data-export.service.js';

const USER_ID = 'user-1';

function buildUser(overrides: Record<string, unknown> = {}) {
    return {
        id: USER_ID,
        email: 'alice@example.com',
        name: 'Alice',
        avatarUrl: null,
        avatarKey: null,
        role: 'USER',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        children: [
            {
                id: 'child-1',
                name: 'Maya',
                birthdate: new Date('2020-03-10'),
                gender: 'FEMALE',
                interests: ['space'],
            },
        ],
        characters: [
            { id: 'char-1', name: 'Maya the Brave', description: 'curly hair', previewKey: null },
        ],
        notifications: [],
        subscription: {
            status: 'ACTIVE',
            currentPeriodEnd: null,
            pagesUsed: 5,
            regenerationsUsed: 1,
            pricingTier: { name: 'Free Chapter' },
        },
        stories: [
            {
                id: 'story-1',
                type: 'BOOK',
                status: 'COMPLETED',
                question: 'Why is the sky blue?',
                title: 'Sky Tale',
                pageCount: 5,
                language: 'EN',
                styleAnchor: 'anchor',
                isPublic: false,
                createdAt: new Date('2026-02-01'),
                pdfKey: 'users/user-1/stories/story-1/story.pdf',
                coverImageKey: null,
                artStyle: { name: 'Storybook' },
                pages: [
                    {
                        order: 1,
                        chapterTitle: null,
                        text: 'Once…',
                        layout: 'book-cover',
                        illustrationPrompt: 'a sky',
                        illustrations: [{ key: 'users/user-1/stories/story-1/pages/1' }],
                    },
                ],
            },
        ],
        ...overrides,
    };
}

describe('DataExportService', () => {
    let service: DataExportService;
    let userFindUnique: ReturnType<typeof vi.fn>;
    let getSignedUrl: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        userFindUnique = vi.fn().mockResolvedValue(buildUser());
        getSignedUrl = vi
            .fn()
            .mockImplementation((key: string) => Promise.resolve(`https://signed.test/${key}`));

        const module = await Test.createTestingModule({
            providers: [
                DataExportService,
                { provide: PrismaService, useValue: { user: { findUnique: userFindUnique } } },
                { provide: StorageService, useValue: { getSignedUrl } },
            ],
        }).compile();

        service = module.get(DataExportService);
    });

    it('should export every personal-data section', async () => {
        const result = await service.exportUserData(USER_ID);

        expect(result).toMatchObject({
            profile: { id: USER_ID, email: 'alice@example.com' },
            subscription: { tier: 'Free Chapter', pagesUsed: 5 },
            children: [{ name: 'Maya' }],
            characters: [{ name: 'Maya the Brave' }],
            notifications: [],
        });
        expect(result.exportedAt).toEqual(expect.any(String));
    });

    it('should sign asset links only for keys that still exist', async () => {
        const result = await service.exportUserData(USER_ID);
        const stories = result.stories as Array<Record<string, unknown>>;

        expect(stories[0].pdfUrl).toBe(
            'https://signed.test/users/user-1/stories/story-1/story.pdf',
        );
        expect(stories[0].coverImageUrl).toBeNull(); // coverImageKey is null — no signing attempted
        expect(getSignedUrl).not.toHaveBeenCalledWith(null);
    });

    it('should include page text, layout, and prompts in the export', async () => {
        const result = await service.exportUserData(USER_ID);
        const stories = result.stories as Array<{ pages: Array<Record<string, unknown>> }>;

        expect(stories[0].pages[0]).toMatchObject({
            order: 1,
            text: 'Once…',
            layout: 'book-cover',
            illustrationPrompt: 'a sky',
            illustrationUrls: ['https://signed.test/users/user-1/stories/story-1/pages/1'],
        });
    });

    it('should throw NotFoundException for an unknown user', async () => {
        userFindUnique.mockResolvedValue(null);

        await expect(service.exportUserData('ghost')).rejects.toThrow(NotFoundException);
    });
});

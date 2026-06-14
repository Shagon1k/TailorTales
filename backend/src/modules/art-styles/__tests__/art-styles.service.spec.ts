import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AI_CLIENT } from '../../ai/ai.types.js';
import { StorageService } from '../../storage/storage.service.js';
import { ArtStylesService } from '../art-styles.service.js';
import { ART_STYLE_MASCOT_PROMPT } from '../art-styles.constants.js';

const STYLE_ID = 'style-1';

function buildStyle(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: STYLE_ID,
        name: 'Storybook',
        slug: 'storybook',
        thumbnailKey: null,
        promptPrefix: 'Classic storybook illustration,',
        isActive: true,
        order: 1,
        createdAt: new Date('2026-01-01'),
        ...overrides,
    };
}

function buildPrismaMock() {
    return {
        artStyle: {
            findMany: vi.fn().mockResolvedValue([buildStyle()]),
            findUnique: vi.fn().mockResolvedValue(buildStyle()),
            create: vi.fn().mockResolvedValue(buildStyle()),
            update: vi
                .fn()
                .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
                    Promise.resolve(buildStyle(data)),
                ),
        },
        $transaction: vi.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
}

describe('ArtStylesService', () => {
    let service: ArtStylesService;
    let prisma: ReturnType<typeof buildPrismaMock>;
    let getSignedUrl: ReturnType<typeof vi.fn>;
    let upload: ReturnType<typeof vi.fn>;
    let generateImage: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        prisma = buildPrismaMock();
        getSignedUrl = vi.fn().mockResolvedValue('https://cdn.example.com/signed');
        upload = vi.fn().mockResolvedValue('art-styles/style-1/thumbnail');
        generateImage = vi.fn().mockResolvedValue(Buffer.from('png'));

        const module = await Test.createTestingModule({
            providers: [
                ArtStylesService,
                { provide: PrismaService, useValue: prisma },
                { provide: StorageService, useValue: { getSignedUrl, upload } },
                { provide: AI_CLIENT, useValue: { generateImage } },
            ],
        }).compile();
        service = module.get(ArtStylesService);
    });

    describe('findAllActive', () => {
        it('should expose a null thumbnailUrl when no thumbnail exists', async () => {
            const result = await service.findAllActive();

            expect(result[0].thumbnailUrl).toBeNull();
            expect(getSignedUrl).not.toHaveBeenCalled();
        });

        it('should sign the thumbnailKey into a fresh URL', async () => {
            prisma.artStyle.findMany.mockResolvedValue([
                buildStyle({ thumbnailKey: 'art-styles/style-1/thumbnail' }),
            ]);

            const result = await service.findAllActive();

            expect(getSignedUrl).toHaveBeenCalledWith('art-styles/style-1/thumbnail');
            expect(result[0].thumbnailUrl).toBe('https://cdn.example.com/signed');
        });

        it('should only return active styles', async () => {
            await service.findAllActive();

            expect(prisma.artStyle.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { isActive: true } }),
            );
        });
    });

    describe('update', () => {
        it('should throw NotFoundException when the style is missing', async () => {
            prisma.artStyle.findUnique.mockResolvedValue(null);

            await expect(service.update(STYLE_ID, { name: 'New' })).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('reorder', () => {
        it('should set each order to the id index', async () => {
            await service.reorder({ orderedIds: ['a', 'b', 'c'] });

            expect(prisma.artStyle.update).toHaveBeenCalledWith({
                where: { id: 'a' },
                data: { order: 0 },
            });
            expect(prisma.artStyle.update).toHaveBeenCalledWith({
                where: { id: 'c' },
                data: { order: 2 },
            });
        });
    });

    describe('generateThumbnail', () => {
        it('should prompt with the style prefix plus the mascot subject', async () => {
            await service.generateThumbnail(STYLE_ID);

            expect(generateImage).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: `Classic storybook illustration, ${ART_STYLE_MASCOT_PROMPT}`,
                }),
            );
        });

        it('should upload the image and persist the key', async () => {
            await service.generateThumbnail(STYLE_ID);

            expect(upload).toHaveBeenCalledWith(
                expect.any(Buffer),
                'art-styles/style-1/thumbnail',
                'image/png',
            );
            expect(prisma.artStyle.update).toHaveBeenCalledWith({
                where: { id: STYLE_ID },
                data: { thumbnailKey: 'art-styles/style-1/thumbnail' },
            });
        });

        it('should throw NotFoundException when the style is missing', async () => {
            prisma.artStyle.findUnique.mockResolvedValue(null);

            await expect(service.generateThumbnail(STYLE_ID)).rejects.toThrow(NotFoundException);
            expect(generateImage).not.toHaveBeenCalled();
        });
    });
});

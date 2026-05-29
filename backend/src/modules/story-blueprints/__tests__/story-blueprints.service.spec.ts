import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { StoryBlueprint } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { StoryBlueprintsService } from '../story-blueprints.service.js';
import type { CreateStoryBlueprintDto } from '../dto/create-story-blueprint.dto.js';

const MOCK_BLUEPRINT: StoryBlueprint = {
    id: 'bp-1',
    name: 'Gentle storybook',
    description: 'A warm, gentle storybook blueprint.',
    type: 'BOOK',
    systemPrompt: '<intro_prompt>Once upon a time</intro_prompt>',
    coverImageKey: null,
    previewPageKeys: [],
    createdById: 'admin-1',
    createdAt: new Date('2026-01-15T09:00:00Z'),
    updatedAt: new Date('2026-01-15T09:00:00Z'),
};

describe('StoryBlueprintsService', () => {
    let service: StoryBlueprintsService;
    let blueprintFindMany: ReturnType<typeof vi.fn>;
    let blueprintFindUnique: ReturnType<typeof vi.fn>;
    let blueprintCreate: ReturnType<typeof vi.fn>;
    let blueprintUpdate: ReturnType<typeof vi.fn>;
    let blueprintDelete: ReturnType<typeof vi.fn>;
    let getSignedUrl: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        blueprintFindMany = vi.fn();
        blueprintFindUnique = vi.fn();
        blueprintCreate = vi.fn();
        blueprintUpdate = vi.fn();
        blueprintDelete = vi.fn();
        getSignedUrl = vi.fn();

        const module = await Test.createTestingModule({
            providers: [
                StoryBlueprintsService,
                {
                    provide: PrismaService,
                    useValue: {
                        storyBlueprint: {
                            findMany: blueprintFindMany,
                            findUnique: blueprintFindUnique,
                            create: blueprintCreate,
                            update: blueprintUpdate,
                            delete: blueprintDelete,
                        },
                    },
                },
                {
                    provide: StorageService,
                    useValue: { getSignedUrl },
                },
            ],
        }).compile();

        service = module.get(StoryBlueprintsService);
    });

    describe('findAll', () => {
        it('should return summaries for all blueprints ordered by createdAt desc', async () => {
            blueprintFindMany.mockResolvedValue([MOCK_BLUEPRINT]);

            const result = await service.findAll();

            expect(blueprintFindMany).toHaveBeenCalledWith(
                expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
            );
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: 'bp-1',
                coverImageUrl: null,
                previewPageUrls: [],
            });
        });

        it('should return an empty array when no blueprints exist', async () => {
            blueprintFindMany.mockResolvedValue([]);

            expect(await service.findAll()).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return the full blueprint detail including systemPrompt', async () => {
            blueprintFindUnique.mockResolvedValue(MOCK_BLUEPRINT);

            const result = await service.findOne('bp-1');

            expect(blueprintFindUnique).toHaveBeenCalledWith({ where: { id: 'bp-1' } });
            expect(result).toMatchObject({
                id: 'bp-1',
                systemPrompt: MOCK_BLUEPRINT.systemPrompt,
                coverImageUrl: null,
            });
        });

        it('should throw NotFoundException when blueprint does not exist', async () => {
            blueprintFindUnique.mockResolvedValue(null);

            await expect(service.findOne('unknown')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a blueprint assigned to the given admin', async () => {
            blueprintCreate.mockResolvedValue(MOCK_BLUEPRINT);
            const dto: CreateStoryBlueprintDto = {
                name: 'Gentle storybook',
                description: 'A warm, gentle storybook blueprint.',
                type: 'BOOK',
                systemPrompt: '<intro_prompt>Once upon a time</intro_prompt>',
            };

            const result = await service.create(dto, 'admin-1');

            expect(blueprintCreate).toHaveBeenCalledWith({
                data: {
                    name: dto.name,
                    description: dto.description,
                    type: dto.type,
                    systemPrompt: dto.systemPrompt,
                    createdById: 'admin-1',
                },
            });
            expect(result).toBe(MOCK_BLUEPRINT);
        });
    });

    describe('update', () => {
        it('should update the blueprint and return the new detail', async () => {
            const updated = { ...MOCK_BLUEPRINT, name: 'Updated storybook' };
            blueprintFindUnique
                .mockResolvedValueOnce(MOCK_BLUEPRINT) // findOne guard inside update
                .mockResolvedValueOnce(updated); // toDetail after update

            blueprintUpdate.mockResolvedValue(updated);

            const result = await service.update('bp-1', { name: 'Updated storybook' });

            expect(blueprintUpdate).toHaveBeenCalledWith({
                where: { id: 'bp-1' },
                data: expect.objectContaining({ name: 'Updated storybook' }),
            });
            expect(result.name).toBe('Updated storybook');
        });

        it('should throw NotFoundException when updating a non-existent blueprint', async () => {
            blueprintFindUnique.mockResolvedValue(null);

            await expect(service.update('unknown', { name: 'X' })).rejects.toThrow(
                NotFoundException,
            );
            expect(blueprintUpdate).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should delete the blueprint', async () => {
            blueprintFindUnique.mockResolvedValue(MOCK_BLUEPRINT);
            blueprintDelete.mockResolvedValue(MOCK_BLUEPRINT);

            await service.remove('bp-1');

            expect(blueprintDelete).toHaveBeenCalledWith({ where: { id: 'bp-1' } });
        });

        it('should throw NotFoundException when blueprint does not exist', async () => {
            blueprintFindUnique.mockResolvedValue(null);

            await expect(service.remove('unknown')).rejects.toThrow(NotFoundException);
            expect(blueprintDelete).not.toHaveBeenCalled();
        });
    });
});

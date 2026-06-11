import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import type { StoryBlueprint, User } from '../../../generated/prisma/client.js';
import { AdminGuard } from '../../auth/guards/admin.guard.js';
import { StoryBlueprintsController } from '../story-blueprints.controller.js';
import { StoryBlueprintsService } from '../story-blueprints.service.js';
import type { IStoryBlueprintDetail, IStoryBlueprintSummary } from '../story-blueprints.types.js';

const MOCK_ADMIN: User = {
    id: 'admin-1',
    googleId: 'google-admin',
    email: 'admin@example.com',
    name: 'Admin',
    avatarUrl: null,
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
    regenerationsInWindow: 0,
    regenerationWindowStartedAt: null,
};

const MOCK_SUMMARY: IStoryBlueprintSummary = {
    id: 'bp-1',
    name: 'Gentle storybook',
    description: 'A warm blueprint.',
    type: 'BOOK',
    createdById: 'admin-1',
    createdAt: new Date('2026-01-15T09:00:00Z'),
    updatedAt: new Date('2026-01-15T09:00:00Z'),
    coverImageUrl: null,
    previewPageUrls: [],
};

const MOCK_DETAIL: IStoryBlueprintDetail = {
    ...MOCK_SUMMARY,
    systemPrompt: '<intro_prompt>Once upon a time</intro_prompt>',
};

const MOCK_RAW: StoryBlueprint = {
    id: 'bp-1',
    name: 'Gentle storybook',
    description: 'A warm blueprint.',
    type: 'BOOK',
    systemPrompt: '<intro_prompt>Once upon a time</intro_prompt>',
    coverImageKey: null,
    previewPageKeys: [],
    createdById: 'admin-1',
    createdAt: new Date('2026-01-15T09:00:00Z'),
    updatedAt: new Date('2026-01-15T09:00:00Z'),
};

describe('StoryBlueprintsController', () => {
    let controller: StoryBlueprintsController;
    let findAll: ReturnType<typeof vi.fn>;
    let findOne: ReturnType<typeof vi.fn>;
    let create: ReturnType<typeof vi.fn>;
    let update: ReturnType<typeof vi.fn>;
    let remove: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        findAll = vi.fn();
        findOne = vi.fn();
        create = vi.fn();
        update = vi.fn();
        remove = vi.fn();

        const module = await Test.createTestingModule({
            controllers: [StoryBlueprintsController],
            providers: [
                {
                    provide: StoryBlueprintsService,
                    useValue: { findAll, findOne, create, update, remove },
                },
                Reflector,
            ],
        }).compile();

        controller = module.get(StoryBlueprintsController);
    });

    describe('findAll', () => {
        it('should return all blueprint summaries (publicly accessible)', async () => {
            findAll.mockResolvedValue([MOCK_SUMMARY]);

            const result = await controller.findAll();

            expect(findAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([MOCK_SUMMARY]);
        });
    });

    describe('findOne', () => {
        it('should return the blueprint detail by id (publicly accessible)', async () => {
            findOne.mockResolvedValue(MOCK_DETAIL);

            const result = await controller.findOne('bp-1');

            expect(findOne).toHaveBeenCalledWith('bp-1');
            expect(result).toBe(MOCK_DETAIL);
        });
    });

    describe('create', () => {
        it('should create a blueprint using the admin user id', async () => {
            create.mockResolvedValue(MOCK_RAW);
            const dto = {
                name: 'Gentle storybook',
                description: 'A warm blueprint.',
                type: 'BOOK' as const,
                systemPrompt: '<intro_prompt>Once upon a time</intro_prompt>',
            };

            const result = await controller.create(MOCK_ADMIN, dto);

            expect(create).toHaveBeenCalledWith(dto, 'admin-1');
            expect(result).toBe(MOCK_RAW);
        });

        it('should have AdminGuard applied on the create route', () => {
            const guards = Reflect.getMetadata(
                '__guards__',
                StoryBlueprintsController.prototype.create,
            ) as unknown[];

            expect(guards).toContain(AdminGuard);
        });
    });

    describe('update', () => {
        it('should update the blueprint by id', async () => {
            update.mockResolvedValue(MOCK_DETAIL);

            const result = await controller.update('bp-1', { name: 'Updated' });

            expect(update).toHaveBeenCalledWith('bp-1', { name: 'Updated' });
            expect(result).toBe(MOCK_DETAIL);
        });

        it('should have AdminGuard applied on the update route', () => {
            const guards = Reflect.getMetadata(
                '__guards__',
                StoryBlueprintsController.prototype.update,
            ) as unknown[];

            expect(guards).toContain(AdminGuard);
        });
    });

    describe('remove', () => {
        it('should delete the blueprint by id', async () => {
            remove.mockResolvedValue(undefined);

            await controller.remove('bp-1');

            expect(remove).toHaveBeenCalledWith('bp-1');
        });

        it('should have AdminGuard applied on the remove route', () => {
            const guards = Reflect.getMetadata(
                '__guards__',
                StoryBlueprintsController.prototype.remove,
            ) as unknown[];

            expect(guards).toContain(AdminGuard);
        });
    });
});

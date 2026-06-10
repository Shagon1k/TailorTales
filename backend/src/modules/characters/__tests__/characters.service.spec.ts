import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Character } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AI_CLIENT } from '../../ai/ai.types.js';
import { StorageService } from '../../storage/storage.service.js';
import { CharactersService } from '../characters.service.js';
import type { CreateCharacterDto } from '../dto/create-character.dto.js';
import type { UpdateCharacterDto } from '../dto/update-character.dto.js';

const MOCK_CHARACTER: Character = {
    id: 'char-1',
    userId: 'user-123',
    childId: 'child-1',
    name: 'Princess Mia',
    description: 'A 6-year-old girl with curly red hair and blue overalls.',
    previewKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('CharactersService', () => {
    let service: CharactersService;
    let characterFindMany: ReturnType<typeof vi.fn>;
    let characterFindFirst: ReturnType<typeof vi.fn>;
    let characterCreate: ReturnType<typeof vi.fn>;
    let characterUpdate: ReturnType<typeof vi.fn>;
    let characterDelete: ReturnType<typeof vi.fn>;
    let storageUpload: ReturnType<typeof vi.fn>;
    let storageDelete: ReturnType<typeof vi.fn>;
    let aiGenerateImage: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        characterFindMany = vi.fn();
        characterFindFirst = vi.fn();
        characterCreate = vi.fn();
        characterUpdate = vi.fn();
        characterDelete = vi.fn();
        storageUpload = vi.fn().mockResolvedValue(undefined);
        storageDelete = vi.fn().mockResolvedValue(undefined);
        aiGenerateImage = vi.fn().mockResolvedValue(Buffer.from('fake-image'));

        const module = await Test.createTestingModule({
            providers: [
                CharactersService,
                {
                    provide: PrismaService,
                    // Note: no `story` key — any accidental prisma.story call would throw,
                    // which guarantees update() never touches Story records (styleAnchor snapshots intact).
                    useValue: {
                        character: {
                            findMany: characterFindMany,
                            findFirst: characterFindFirst,
                            create: characterCreate,
                            update: characterUpdate,
                            delete: characterDelete,
                        },
                    },
                },
                {
                    provide: StorageService,
                    useValue: { upload: storageUpload, delete: storageDelete },
                },
                {
                    provide: AI_CLIENT,
                    useValue: { generateImage: aiGenerateImage },
                },
            ],
        }).compile();

        service = module.get(CharactersService);
    });

    describe('findAllByUser', () => {
        it('should return all characters for the user', async () => {
            characterFindMany.mockResolvedValue([MOCK_CHARACTER]);

            const result = await service.findAllByUser('user-123');

            expect(characterFindMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { createdAt: 'asc' },
            });
            expect(result).toEqual([MOCK_CHARACTER]);
        });

        it('should filter by childId when provided', async () => {
            characterFindMany.mockResolvedValue([MOCK_CHARACTER]);

            await service.findAllByUser('user-123', 'child-1');

            expect(characterFindMany).toHaveBeenCalledWith({
                where: { userId: 'user-123', childId: 'child-1' },
                orderBy: { createdAt: 'asc' },
            });
        });

        it('should return an empty array when the user has no characters', async () => {
            characterFindMany.mockResolvedValue([]);

            const result = await service.findAllByUser('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return the character when found', async () => {
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);

            const result = await service.findOne('char-1', 'user-123');

            expect(result).toBe(MOCK_CHARACTER);
        });

        it('should throw NotFoundException when character does not exist', async () => {
            characterFindFirst.mockResolvedValue(null);

            await expect(service.findOne('unknown', 'user-123')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when character belongs to a different user', async () => {
            characterFindFirst.mockResolvedValue(null);

            await expect(service.findOne('char-1', 'other-user')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('findByChild', () => {
        it('should return the character for the given child', async () => {
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);

            const result = await service.findByChild('child-1', 'user-123');

            expect(result).toBe(MOCK_CHARACTER);
        });

        it('should return null when no character exists for the child', async () => {
            characterFindFirst.mockResolvedValue(null);

            const result = await service.findByChild('child-1', 'user-123');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create and return a new character linked to a child', async () => {
            characterFindFirst.mockResolvedValue(null);
            characterCreate.mockResolvedValue(MOCK_CHARACTER);
            const dto: CreateCharacterDto = {
                name: 'Princess Mia',
                description: 'A 6-year-old girl with curly red hair and blue overalls.',
                childId: 'child-1',
            };

            const result = await service.create('user-123', dto);

            expect(characterCreate).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    name: dto.name,
                    description: dto.description,
                    childId: dto.childId,
                },
            });
            expect(result).toBe(MOCK_CHARACTER);
        });

        it('should create a standalone character when no childId is given', async () => {
            const standalone = { ...MOCK_CHARACTER, childId: null };
            characterCreate.mockResolvedValue(standalone);
            const dto: CreateCharacterDto = { name: 'Generic Hero', description: 'A brave hero.' };

            await service.create('user-123', dto);

            // No conflict check performed when childId is absent
            expect(characterFindFirst).not.toHaveBeenCalled();
            expect(characterCreate).toHaveBeenCalledWith({
                data: { userId: 'user-123', name: dto.name, description: dto.description },
            });
        });

        it('should throw ConflictException when the child already has a character', async () => {
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);
            const dto: CreateCharacterDto = {
                name: 'Another',
                description: 'Duplicate.',
                childId: 'child-1',
            };

            await expect(service.create('user-123', dto)).rejects.toThrow(ConflictException);
            expect(characterCreate).not.toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update and return the character', async () => {
            const updated = { ...MOCK_CHARACTER, description: 'Updated look.' };
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);
            characterUpdate.mockResolvedValue(updated);
            const dto: UpdateCharacterDto = { description: 'Updated look.' };

            const result = await service.update('char-1', 'user-123', dto);

            expect(characterUpdate).toHaveBeenCalledWith({
                where: { id: 'char-1' },
                data: { description: 'Updated look.' },
            });
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundException when character belongs to a different user', async () => {
            characterFindFirst.mockResolvedValue(null);

            await expect(service.update('char-1', 'other-user', { name: 'X' })).rejects.toThrow(
                NotFoundException,
            );
            expect(characterUpdate).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should delete the character when it has no preview image', async () => {
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);
            characterDelete.mockResolvedValue(MOCK_CHARACTER);

            await service.remove('char-1', 'user-123');

            expect(storageDelete).not.toHaveBeenCalled();
            expect(characterDelete).toHaveBeenCalledWith({ where: { id: 'char-1' } });
        });

        it('should delete the preview image from storage before removing the character', async () => {
            const withPreview = {
                ...MOCK_CHARACTER,
                previewKey: 'users/user-123/characters/char-1/preview',
            };
            characterFindFirst.mockResolvedValue(withPreview);
            characterDelete.mockResolvedValue(withPreview);

            await service.remove('char-1', 'user-123');

            expect(storageDelete).toHaveBeenCalledWith(withPreview.previewKey);
            expect(characterDelete).toHaveBeenCalledWith({ where: { id: 'char-1' } });
        });

        it('should throw NotFoundException when character belongs to a different user', async () => {
            characterFindFirst.mockResolvedValue(null);

            await expect(service.remove('char-1', 'other-user')).rejects.toThrow(NotFoundException);
            expect(characterDelete).not.toHaveBeenCalled();
        });
    });

    describe('generatePreview', () => {
        it('should generate an image and persist the preview key', async () => {
            const previewKey = 'users/user-123/characters/char-1/preview';
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);
            characterUpdate.mockResolvedValue({ ...MOCK_CHARACTER, previewKey });

            await service.generatePreview('char-1', 'user-123');

            expect(aiGenerateImage).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: expect.stringContaining(MOCK_CHARACTER.description),
                }),
            );
            expect(storageUpload).toHaveBeenCalledWith(expect.any(Buffer), previewKey, 'image/png');
            expect(characterUpdate).toHaveBeenCalledWith({
                where: { id: 'char-1' },
                data: { previewKey },
            });
        });

        it('should delete the old preview from storage when replacing it', async () => {
            const oldKey = 'users/user-123/characters/char-1/preview-old';
            // Simulate a character that already has a previewKey stored under a different path
            const withOldPreview = { ...MOCK_CHARACTER, previewKey: oldKey };
            characterFindFirst.mockResolvedValue(withOldPreview);
            characterUpdate.mockResolvedValue({
                ...withOldPreview,
                previewKey: 'users/user-123/characters/char-1/preview',
            });

            await service.generatePreview('char-1', 'user-123');

            expect(storageDelete).toHaveBeenCalledWith(oldKey);
        });

        it('should throw NotFoundException when character does not exist', async () => {
            characterFindFirst.mockResolvedValue(null);

            await expect(service.generatePreview('unknown', 'user-123')).rejects.toThrow(
                NotFoundException,
            );
            expect(aiGenerateImage).not.toHaveBeenCalled();
        });
    });
});

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Character } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AI_CLIENT } from '../../ai/ai.types.js';
import { StorageService } from '../../storage/storage.service.js';
import { QuotaService } from '../../subscriptions/quota.service.js';
import { CharactersService } from '../characters.service.js';
import type { CreateCharacterDto } from '../dto/create-character.dto.js';
import type { UpdateCharacterDto } from '../dto/update-character.dto.js';

const MOCK_CHARACTER: Character = {
    id: 'char-1',
    userId: 'user-123',
    childId: 'child-1',
    source: 'IMAGINED',
    name: 'Princess Mia',
    description: 'A 6-year-old girl with curly red hair and blue overalls.',
    previewKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const MOCK_CHARACTER_RESPONSE = {
    ...MOCK_CHARACTER,
    previewUrl: null,
};

describe('CharactersService', () => {
    let service: CharactersService;
    let characterFindMany: ReturnType<typeof vi.fn>;
    let characterFindFirst: ReturnType<typeof vi.fn>;
    let characterCreate: ReturnType<typeof vi.fn>;
    let characterUpdate: ReturnType<typeof vi.fn>;
    let characterDelete: ReturnType<typeof vi.fn>;
    let prismaTransaction: ReturnType<typeof vi.fn>;
    let storageUpload: ReturnType<typeof vi.fn>;
    let storageDelete: ReturnType<typeof vi.fn>;
    let storageGetSignedUrl: ReturnType<typeof vi.fn>;
    let aiGenerateImage: ReturnType<typeof vi.fn>;
    let aiGenerateCharacterProfile: ReturnType<typeof vi.fn>;
    let assertCharacterLimit: ReturnType<typeof vi.fn>;
    let assertCharacterGenerationCredit: ReturnType<typeof vi.fn>;
    let recordCharacterGeneration: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        characterFindMany = vi.fn();
        characterFindFirst = vi.fn();
        characterCreate = vi.fn();
        characterUpdate = vi.fn();
        characterDelete = vi.fn();
        prismaTransaction = vi.fn(async (callback) =>
            callback({
                character: {
                    create: characterCreate,
                },
                subscription: {
                    update: vi.fn(),
                },
            }),
        );
        storageUpload = vi.fn().mockResolvedValue(undefined);
        storageDelete = vi.fn().mockResolvedValue(undefined);
        storageGetSignedUrl = vi.fn().mockResolvedValue('https://signed.test/char-1.png');
        aiGenerateImage = vi.fn().mockResolvedValue(Buffer.from('fake-image'));
        aiGenerateCharacterProfile = vi.fn();
        assertCharacterLimit = vi.fn().mockResolvedValue(undefined);
        assertCharacterGenerationCredit = vi.fn().mockResolvedValue(undefined);
        recordCharacterGeneration = vi.fn().mockResolvedValue(undefined);

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
                        $transaction: prismaTransaction,
                    },
                },
                {
                    provide: StorageService,
                    useValue: {
                        upload: storageUpload,
                        delete: storageDelete,
                        getSignedUrl: storageGetSignedUrl,
                    },
                },
                {
                    provide: AI_CLIENT,
                    useValue: {
                        generateImage: aiGenerateImage,
                        generateCharacterProfile: aiGenerateCharacterProfile,
                    },
                },
                {
                    provide: QuotaService,
                    useValue: {
                        assertCharacterLimit,
                        assertCharacterGenerationCredit,
                        recordCharacterGeneration,
                    },
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
            expect(result).toEqual([MOCK_CHARACTER_RESPONSE]);
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

            expect(result).toEqual(MOCK_CHARACTER_RESPONSE);
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
        it('should normalize a free-form idea with AI, record usage, and generate a preview', async () => {
            aiGenerateCharacterProfile.mockResolvedValue({
                name: 'Princess Mia',
                description: 'A 6-year-old girl with curly red hair and blue overalls.',
            });
            characterCreate.mockResolvedValue(MOCK_CHARACTER);
            characterUpdate.mockResolvedValue({
                ...MOCK_CHARACTER,
                previewKey: 'users/user-123/characters/char-1/preview',
            });
            const dto: CreateCharacterDto = {
                name: 'Princess Mia',
                description: 'A 6-year-old girl with curly red hair and blue overalls.',
                childId: 'child-1',
            };

            const result = await service.create('user-123', dto);

            expect(aiGenerateCharacterProfile).toHaveBeenCalledWith({
                prompt: expect.stringContaining('Preferred character name: Princess Mia.'),
                maxTokens: expect.any(Number),
            });
            expect(characterCreate).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    name: 'Princess Mia',
                    description: 'A 6-year-old girl with curly red hair and blue overalls.',
                    source: 'IMAGINED',
                    childId: dto.childId,
                },
            });
            expect(assertCharacterLimit).toHaveBeenCalledWith('user-123');
            expect(assertCharacterGenerationCredit).toHaveBeenCalledWith('user-123');
            expect(recordCharacterGeneration).toHaveBeenCalledWith('user-123', expect.any(Object));
            expect(aiGenerateImage).toHaveBeenCalled();
            expect(result).toEqual({
                ...MOCK_CHARACTER,
                previewKey: 'users/user-123/characters/char-1/preview',
                previewUrl: 'https://signed.test/char-1.png',
            });
        });

        it('should preserve the QUIZ source while still using the shared AI pipeline', async () => {
            aiGenerateCharacterProfile.mockResolvedValue({
                name: 'Pip',
                description: 'A girl with short brown hair.',
            });
            characterCreate.mockResolvedValue(MOCK_CHARACTER);
            characterUpdate.mockResolvedValue({
                ...MOCK_CHARACTER,
                previewKey: 'users/user-123/characters/char-1/preview',
            });
            const dto: CreateCharacterDto = {
                name: 'Pip',
                description: 'A girl with short brown hair.',
                childId: 'child-1',
                source: 'QUIZ',
            };

            await service.create('user-123', dto);

            expect(aiGenerateCharacterProfile).toHaveBeenCalledWith({
                prompt: expect.stringContaining('guided character form'),
                maxTokens: expect.any(Number),
            });
            expect(characterCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({ source: 'QUIZ' }),
            });
        });

        it('should not perform a uniqueness lookup — a child may have several characters', async () => {
            aiGenerateCharacterProfile.mockResolvedValue({
                name: 'Princess Mia',
                description: 'A brave hero.',
            });
            characterCreate.mockResolvedValue(MOCK_CHARACTER);
            characterUpdate.mockResolvedValue({
                ...MOCK_CHARACTER,
                previewKey: 'users/user-123/characters/char-1/preview',
            });
            const dto: CreateCharacterDto = {
                name: 'Princess Mia',
                description: 'A brave hero.',
                childId: 'child-1',
            };

            await service.create('user-123', dto);

            expect(characterFindFirst).not.toHaveBeenCalled();
        });
    });

    describe('createFromPrompt', () => {
        it('should expand the prompt via AI and save it as free-form (IMAGINED)', async () => {
            aiGenerateCharacterProfile.mockResolvedValue({
                name: 'Captain Pip',
                description: 'A brave little fox in a red scarf.',
            });
            characterCreate.mockResolvedValue({
                ...MOCK_CHARACTER,
                name: 'Captain Pip',
                description: 'A brave little fox in a red scarf.',
            });
            characterUpdate.mockResolvedValue({
                ...MOCK_CHARACTER,
                name: 'Captain Pip',
                description: 'A brave little fox in a red scarf.',
                previewKey: 'users/user-123/characters/char-1/preview',
            });

            const result = await service.createFromPrompt('user-123', {
                childId: 'child-1',
                prompt: 'a brave fox who loves the sea',
            });

            expect(aiGenerateCharacterProfile).toHaveBeenCalledWith(
                expect.objectContaining({ prompt: 'a brave fox who loves the sea' }),
            );
            expect(assertCharacterLimit).toHaveBeenCalledWith('user-123');
            expect(assertCharacterGenerationCredit).toHaveBeenCalledWith('user-123');
            expect(prismaTransaction).toHaveBeenCalled();
            expect(recordCharacterGeneration).toHaveBeenCalledWith('user-123', expect.any(Object));
            expect(result).toEqual({
                ...MOCK_CHARACTER,
                name: 'Captain Pip',
                description: 'A brave little fox in a red scarf.',
                previewKey: 'users/user-123/characters/char-1/preview',
                previewUrl: 'https://signed.test/char-1.png',
            });
        });
    });

    describe('update', () => {
        it('should update and return the character without regenerating preview', async () => {
            const updated = { ...MOCK_CHARACTER, description: 'Updated look.' };
            characterFindFirst.mockResolvedValue(MOCK_CHARACTER);
            characterUpdate.mockResolvedValue(updated);
            const dto: UpdateCharacterDto = { description: 'Updated look.' };

            const result = await service.update('char-1', 'user-123', dto);

            expect(characterUpdate).toHaveBeenCalledWith({
                where: { id: 'char-1' },
                data: { description: 'Updated look.' },
            });
            expect(aiGenerateImage).not.toHaveBeenCalled();
            expect(result).toEqual({ ...updated, previewUrl: null });
        });

        it('should clear and delete a stale preview when the character identity changes', async () => {
            const withPreview = {
                ...MOCK_CHARACTER,
                previewKey: 'users/user-123/characters/char-1/preview',
            };
            characterFindFirst.mockResolvedValue(withPreview);
            characterUpdate.mockResolvedValue({
                ...withPreview,
                name: 'Prince Leo',
                previewKey: null,
            });

            const result = await service.update('char-1', 'user-123', { name: 'Prince Leo' });

            expect(characterUpdate).toHaveBeenCalledWith({
                where: { id: 'char-1' },
                data: { name: 'Prince Leo', previewKey: null },
            });
            expect(storageDelete).toHaveBeenCalledWith(withPreview.previewKey);
            expect(result).toEqual({
                ...withPreview,
                name: 'Prince Leo',
                previewKey: null,
                previewUrl: null,
            });
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

            const result = await service.generatePreview('char-1', 'user-123');

            expect(aiGenerateImage).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: expect.stringContaining(MOCK_CHARACTER.description),
                }),
            );
            expect(assertCharacterGenerationCredit).toHaveBeenCalledWith('user-123');
            expect(storageUpload).toHaveBeenCalledWith(expect.any(Buffer), previewKey, 'image/png');
            expect(characterUpdate).toHaveBeenCalledWith({
                where: { id: 'char-1' },
                data: { previewKey },
            });
            expect(recordCharacterGeneration).toHaveBeenCalledWith('user-123');
            expect(result).toEqual({
                ...MOCK_CHARACTER,
                previewKey,
                previewUrl: 'https://signed.test/char-1.png',
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

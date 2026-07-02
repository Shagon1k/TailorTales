import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Character } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { type IAiClient, AI_CLIENT } from '../ai/ai.types.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { QuotaService } from '../subscriptions/quota.service.js';
import {
    CHARACTER_PREVIEW_IMAGE_SIZE,
    CHARACTER_PROFILE_MAX_TOKENS,
} from './characters.constants.js';
import { buildCharacterPreviewPrompt, buildCharacterProfilePrompt } from './characters.prompts.js';
import type { ICharacterResponse } from './characters.types.js';
import type { CreateCharacterDto } from './dto/create-character.dto.js';
import type { CreateCharacterFromPromptDto } from './dto/create-character-from-prompt.dto.js';
import type { UpdateCharacterDto } from './dto/update-character.dto.js';

@Injectable()
export class CharactersService {
    private readonly logger = new Logger(CharactersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        private readonly quota: QuotaService,
        @Inject(AI_CLIENT) private readonly ai: IAiClient,
    ) {}

    async findAllByUser(userId: string, childId?: string): Promise<ICharacterResponse[]> {
        const characters = await this.prisma.character.findMany({
            where: { userId, ...(childId !== undefined && { childId }) },
            orderBy: { createdAt: 'asc' },
        });

        return Promise.all(characters.map((character) => this.toResponse(character)));
    }

    async findOne(id: string, userId: string): Promise<ICharacterResponse> {
        const character = await this.findOneEntity(id, userId);
        return this.toResponse(character);
    }

    private async findOneEntity(id: string, userId: string): Promise<Character> {
        const character = await this.prisma.character.findFirst({ where: { id, userId } });
        if (!character) throw new NotFoundException(`Character ${id} not found`);
        return character;
    }

    async findByChild(childId: string, userId: string): Promise<Character | null> {
        return this.prisma.character.findFirst({ where: { childId, userId } });
    }

    async create(userId: string, dto: CreateCharacterDto): Promise<ICharacterResponse> {
        await this.quota.assertCharacterLimit(userId);
        await this.quota.assertCharacterGenerationCredit(userId);

        return this.createGeneratedCharacter({
            userId,
            childId: dto.childId,
            source: dto.source ?? 'IMAGINED',
            prompt: buildCharacterProfilePrompt({
                source: dto.source ?? 'IMAGINED',
                name: dto.name,
                description: dto.description,
            }),
        });
    }

    /** Expands a parent's free-text idea into a character profile and saves it (free-form → IMAGINED). */
    async createFromPrompt(
        userId: string,
        dto: CreateCharacterFromPromptDto,
    ): Promise<ICharacterResponse> {
        await this.quota.assertCharacterLimit(userId);
        await this.quota.assertCharacterGenerationCredit(userId);
        return this.createGeneratedCharacter({
            userId,
            childId: dto.childId,
            source: 'IMAGINED',
            prompt: dto.prompt,
        });
    }

    async update(id: string, userId: string, dto: UpdateCharacterDto): Promise<ICharacterResponse> {
        const existing = await this.findOneEntity(id, userId);
        const shouldClearPreview =
            existing.previewKey !== null &&
            ((dto.name !== undefined && dto.name !== existing.name) ||
                (dto.description !== undefined && dto.description !== existing.description));

        const updated = await this.prisma.character.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(shouldClearPreview && { previewKey: null }),
            },
        });

        if (shouldClearPreview) {
            const stalePreviewKey = existing.previewKey;
            if (stalePreviewKey) {
                this.storage.delete(stalePreviewKey).catch((error: unknown) => {
                    const err = error instanceof Error ? error : new Error(String(error));
                    this.logger.error(
                        `Failed to delete stale preview for character ${existing.id}: ${err.message}`,
                        err.stack,
                    );
                });
            }
        }

        return this.toResponse(updated);
    }

    async remove(id: string, userId: string): Promise<void> {
        const character = await this.findOneEntity(id, userId);
        if (character.previewKey) {
            await this.storage.delete(character.previewKey);
        }
        await this.prisma.character.delete({ where: { id } });
    }

    async generatePreview(id: string, userId: string): Promise<ICharacterResponse> {
        await this.quota.assertCharacterGenerationCredit(userId);
        const character = await this.findOneEntity(id, userId);
        const updated = await this.generatePreviewEntity(character);
        await this.quota.recordCharacterGeneration(userId);
        return this.toResponse(updated);
    }

    private async generatePreviewEntity(character: Character): Promise<Character> {
        this.logger.log(`Generating preview for character ${character.id}`);
        const prompt = buildCharacterPreviewPrompt(character.name, character.description);

        const imageBuffer = await this.ai.generateImage({
            prompt,
            size: CHARACTER_PREVIEW_IMAGE_SIZE,
        });

        const key = StorageKeys.characterPreview(character.userId, character.id);
        await this.storage.upload(imageBuffer, key, 'image/png');

        if (character.previewKey && character.previewKey !== key) {
            await this.storage.delete(character.previewKey);
        }

        return this.prisma.character.update({
            where: { id: character.id },
            data: { previewKey: key },
        });
    }

    private async generatePreviewBestEffort(character: Character): Promise<ICharacterResponse> {
        try {
            const updated = await this.generatePreviewEntity(character);
            return this.toResponse(updated);
        } catch (err: unknown) {
            const error = err instanceof Error ? err : new Error(String(err));
            this.logger.error(
                `Character ${character.id} preview generation failed; continuing without preview: ${error.message}`,
                error.stack,
            );
            return this.toResponse(character);
        }
    }

    private async createGeneratedCharacter(input: {
        userId: string;
        childId: string;
        source: 'IMAGINED' | 'QUIZ';
        prompt: string;
    }): Promise<ICharacterResponse> {
        const profile = await this.ai.generateCharacterProfile({
            prompt: input.prompt,
            maxTokens: CHARACTER_PROFILE_MAX_TOKENS,
        });

        const character = await this.prisma.$transaction(async (tx) => {
            const created = await tx.character.create({
                data: {
                    userId: input.userId,
                    childId: input.childId,
                    source: input.source,
                    name: profile.name,
                    description: profile.description,
                },
            });
            await this.quota.recordCharacterGeneration(input.userId, tx);
            return created;
        });

        return this.generatePreviewBestEffort(character);
    }

    private async toResponse(character: Character): Promise<ICharacterResponse> {
        return {
            ...character,
            previewUrl: character.previewKey
                ? await this.storage.getSignedUrl(character.previewKey)
                : null,
        };
    }
}

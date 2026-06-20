import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Character } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { type IAiClient, AI_CLIENT } from '../ai/ai.types.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { CHARACTER_PREVIEW_IMAGE_SIZE } from './characters.constants.js';
import { buildCharacterPreviewPrompt } from './characters.prompts.js';
import type { CreateCharacterDto } from './dto/create-character.dto.js';
import type { UpdateCharacterDto } from './dto/update-character.dto.js';

@Injectable()
export class CharactersService {
    private readonly logger = new Logger(CharactersService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        @Inject(AI_CLIENT) private readonly ai: IAiClient,
    ) {}

    findAllByUser(userId: string, childId?: string): Promise<Character[]> {
        return this.prisma.character.findMany({
            where: { userId, ...(childId !== undefined && { childId }) },
            orderBy: { createdAt: 'asc' },
        });
    }

    async findOne(id: string, userId: string): Promise<Character> {
        const character = await this.prisma.character.findFirst({ where: { id, userId } });
        if (!character) throw new NotFoundException(`Character ${id} not found`);
        return character;
    }

    async findByChild(childId: string, userId: string): Promise<Character | null> {
        return this.prisma.character.findFirst({ where: { childId, userId } });
    }

    async create(userId: string, dto: CreateCharacterDto): Promise<Character> {
        // Every character belongs to a child. A child may have several characters.
        // Wave-1 only creates child-derived characters (FROM_CHILD); IMAGINED/PROMPT
        // creation flows arrive with the quiz/prompt features.
        return this.prisma.character.create({
            data: {
                userId,
                childId: dto.childId,
                source: 'FROM_CHILD',
                name: dto.name,
                description: dto.description,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateCharacterDto): Promise<Character> {
        await this.findOne(id, userId);
        return this.prisma.character.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
            },
        });
    }

    async remove(id: string, userId: string): Promise<void> {
        const character = await this.findOne(id, userId);
        if (character.previewKey) {
            await this.storage.delete(character.previewKey);
        }
        await this.prisma.character.delete({ where: { id } });
    }

    async generatePreview(id: string, userId: string): Promise<Character> {
        const character = await this.findOne(id, userId);

        this.logger.log(`Generating preview for character ${id}`);
        const prompt = buildCharacterPreviewPrompt(character.description);

        const imageBuffer = await this.ai.generateImage({
            prompt,
            size: CHARACTER_PREVIEW_IMAGE_SIZE,
        });

        const key = StorageKeys.characterPreview(userId, id);
        await this.storage.upload(imageBuffer, key, 'image/png');

        if (character.previewKey && character.previewKey !== key) {
            await this.storage.delete(character.previewKey);
        }

        return this.prisma.character.update({ where: { id }, data: { previewKey: key } });
    }
}

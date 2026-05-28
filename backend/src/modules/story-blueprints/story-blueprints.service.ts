import { Injectable, NotFoundException } from '@nestjs/common';
import type { StoryBlueprint } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { CreateStoryBlueprintDto } from './dto/create-story-blueprint.dto.js';
import { UpdateStoryBlueprintDto } from './dto/update-story-blueprint.dto.js';
import type { IStoryBlueprintDetail, IStoryBlueprintSummary } from './story-blueprints.types.js';

@Injectable()
export class StoryBlueprintsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    async findAll(): Promise<IStoryBlueprintSummary[]> {
        const blueprints = await this.prisma.storyBlueprint.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return Promise.all(blueprints.map((b) => this.toSummary(b)));
    }

    async findOne(id: string): Promise<IStoryBlueprintDetail> {
        const blueprint = await this.prisma.storyBlueprint.findUnique({ where: { id } });

        if (!blueprint) throw new NotFoundException(`StoryBlueprint ${id} not found`);

        return this.toDetail(blueprint);
    }

    create(dto: CreateStoryBlueprintDto, adminId: string): Promise<StoryBlueprint> {
        return this.prisma.storyBlueprint.create({
            data: {
                name: dto.name,
                description: dto.description,
                type: dto.type,
                systemPrompt: dto.systemPrompt,
                createdById: adminId,
            },
        });
    }

    async update(id: string, dto: UpdateStoryBlueprintDto): Promise<IStoryBlueprintDetail> {
        await this.findOne(id);

        const updated = await this.prisma.storyBlueprint.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                type: dto.type,
                systemPrompt: dto.systemPrompt,
            },
        });

        return this.toDetail(updated);
    }

    async remove(id: string): Promise<void> {
        const blueprint = await this.prisma.storyBlueprint.findUnique({ where: { id } });

        if (!blueprint) throw new NotFoundException(`StoryBlueprint ${id} not found`);

        // Post-MVP: add S3 asset deletion (coverImageKey + previewPageKeys) when
        // the admin UI uploads files through the platform rather than externally.

        await this.prisma.storyBlueprint.delete({ where: { id } });
    }

    // --- private helpers ---

    private async toSummary(blueprint: StoryBlueprint): Promise<IStoryBlueprintSummary> {
        const { coverImageKey, previewPageKeys } = blueprint;

        return {
            id: blueprint.id,
            name: blueprint.name,
            description: blueprint.description,
            type: blueprint.type,
            createdById: blueprint.createdById,
            createdAt: blueprint.createdAt,
            updatedAt: blueprint.updatedAt,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            previewPageUrls: await Promise.all(
                previewPageKeys.map((k) => this.storage.getSignedUrl(k)),
            ),
        };
    }

    private async toDetail(blueprint: StoryBlueprint): Promise<IStoryBlueprintDetail> {
        const { coverImageKey, previewPageKeys, ...rest } = blueprint;

        return {
            ...rest,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            previewPageUrls: await Promise.all(
                previewPageKeys.map((k) => this.storage.getSignedUrl(k)),
            ),
        };
    }
}

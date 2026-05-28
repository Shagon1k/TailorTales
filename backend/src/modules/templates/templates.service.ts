import { Injectable, NotFoundException } from '@nestjs/common';
import type { Template } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import type { ITemplateDetail, ITemplateSummary } from './templates.types.js';

@Injectable()
export class TemplatesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    async findAll(): Promise<ITemplateSummary[]> {
        const templates = await this.prisma.template.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return Promise.all(templates.map((t) => this.toSummary(t)));
    }

    async findOne(id: string): Promise<ITemplateDetail> {
        const template = await this.prisma.template.findUnique({ where: { id } });

        if (!template) throw new NotFoundException(`Template ${id} not found`);

        return this.toDetail(template);
    }

    create(dto: CreateTemplateDto, adminId: string): Promise<Template> {
        return this.prisma.template.create({
            data: {
                name: dto.name,
                description: dto.description,
                type: dto.type,
                systemPrompt: dto.systemPrompt,
                createdById: adminId,
            },
        });
    }

    async update(id: string, dto: UpdateTemplateDto): Promise<ITemplateDetail> {
        await this.findOne(id);

        const updated = await this.prisma.template.update({
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
        const template = await this.prisma.template.findUnique({ where: { id } });

        if (!template) throw new NotFoundException(`Template ${id} not found`);

        // Phase 11: add S3 asset deletion (coverImageKey + previewPageKeys) when
        // the admin UI uploads files through the platform rather than externally.

        await this.prisma.template.delete({ where: { id } });
    }

    // --- private helpers ---

    private async toSummary(template: Template): Promise<ITemplateSummary> {
        const { coverImageKey, previewPageKeys } = template;

        return {
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            createdById: template.createdById,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            previewPageUrls: await Promise.all(
                previewPageKeys.map((k) => this.storage.getSignedUrl(k)),
            ),
        };
    }

    private async toDetail(template: Template): Promise<ITemplateDetail> {
        const { coverImageKey, previewPageKeys, ...rest } = template;

        return {
            ...rest,
            coverImageUrl: coverImageKey ? await this.storage.getSignedUrl(coverImageKey) : null,
            previewPageUrls: await Promise.all(
                previewPageKeys.map((k) => this.storage.getSignedUrl(k)),
            ),
        };
    }
}

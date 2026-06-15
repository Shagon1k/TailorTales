import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ArtStyle } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AI_CLIENT, type IAiClient } from '../ai/ai.types.js';
import { StorageService } from '../storage/storage.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { ART_STYLE_MASCOT_PROMPT, ART_STYLE_THUMBNAIL_SIZE } from './art-styles.constants.js';
import type { IArtStyle } from './art-styles.types.js';
import { CreateArtStyleDto } from './dto/create-art-style.dto.js';
import { ReorderArtStylesDto } from './dto/reorder-art-styles.dto.js';
import { UpdateArtStyleDto } from './dto/update-art-style.dto.js';

@Injectable()
export class ArtStylesService {
    private readonly logger = new Logger(ArtStylesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        @Inject(AI_CLIENT) private readonly ai: IAiClient,
    ) {}

    /** Active styles for the public workshop picker. */
    async findAllActive(): Promise<IArtStyle[]> {
        const styles = await this.prisma.artStyle.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
        });
        return Promise.all(styles.map((style) => this.toResponse(style)));
    }

    /** Every style (active or not) for the admin list. */
    async findAll(): Promise<IArtStyle[]> {
        const styles = await this.prisma.artStyle.findMany({ orderBy: { order: 'asc' } });
        return Promise.all(styles.map((style) => this.toResponse(style)));
    }

    async create(dto: CreateArtStyleDto): Promise<IArtStyle> {
        const style = await this.prisma.artStyle.create({ data: dto });
        return this.toResponse(style);
    }

    async update(id: string, dto: UpdateArtStyleDto): Promise<IArtStyle> {
        await this.requireStyle(id);
        const style = await this.prisma.artStyle.update({ where: { id }, data: dto });
        return this.toResponse(style);
    }

    /** Persist a new display order — each id's array index becomes its `order`. */
    async reorder(dto: ReorderArtStylesDto): Promise<IArtStyle[]> {
        await this.prisma.$transaction(
            dto.orderedIds.map((id, index) =>
                this.prisma.artStyle.update({ where: { id }, data: { order: index } }),
            ),
        );
        return this.findAll();
    }

    /**
     * Render a sample thumbnail for the style: the style's promptPrefix plus the fixed mascot
     * subject, stored as a private S3 object and signed at serve time.
     */
    async generateThumbnail(id: string): Promise<IArtStyle> {
        const style = await this.requireStyle(id);

        this.logger.log(`Generating thumbnail for art style ${id} (${style.slug})`);
        const imageBuffer = await this.ai.generateImage({
            prompt: `${style.promptPrefix} ${ART_STYLE_MASCOT_PROMPT}`,
            size: ART_STYLE_THUMBNAIL_SIZE,
        });

        const key = StorageKeys.artStyleThumbnail(id);
        await this.storage.upload(imageBuffer, key, 'image/png');

        const updated = await this.prisma.artStyle.update({
            where: { id },
            data: { thumbnailKey: key },
        });
        return this.toResponse(updated);
    }

    private async requireStyle(id: string): Promise<ArtStyle> {
        const style = await this.prisma.artStyle.findUnique({ where: { id } });
        if (!style) {
            throw new NotFoundException(`Art style ${id} not found`);
        }
        return style;
    }

    private async toResponse(style: ArtStyle): Promise<IArtStyle> {
        const { thumbnailKey, ...rest } = style;
        return {
            ...rest,
            thumbnailUrl: thumbnailKey ? await this.storage.getSignedUrl(thumbnailKey) : null,
        };
    }
}

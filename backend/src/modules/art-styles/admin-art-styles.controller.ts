import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { ArtStylesService } from './art-styles.service.js';
import type { IArtStyle } from './art-styles.types.js';
import { CreateArtStyleDto } from './dto/create-art-style.dto.js';
import { ReorderArtStylesDto } from './dto/reorder-art-styles.dto.js';
import { UpdateArtStyleDto } from './dto/update-art-style.dto.js';

@Controller('admin/art-styles')
@UseGuards(AdminGuard)
export class AdminArtStylesController {
    constructor(private readonly artStylesService: ArtStylesService) {}

    @Get()
    findAll(): Promise<IArtStyle[]> {
        return this.artStylesService.findAll();
    }

    @Post()
    create(@Body() dto: CreateArtStyleDto): Promise<IArtStyle> {
        return this.artStylesService.create(dto);
    }

    // Declared before ':id' so the literal path wins the route match.
    @Patch('reorder')
    reorder(@Body() dto: ReorderArtStylesDto): Promise<IArtStyle[]> {
        return this.artStylesService.reorder(dto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateArtStyleDto): Promise<IArtStyle> {
        return this.artStylesService.update(id, dto);
    }

    @Post(':id/thumbnail')
    generateThumbnail(@Param('id') id: string): Promise<IArtStyle> {
        return this.artStylesService.generateThumbnail(id);
    }
}

import { Controller, Get } from '@nestjs/common';
import { ArtStylesService } from './art-styles.service.js';
import type { IArtStyle } from './art-styles.types.js';

@Controller('art-styles')
export class ArtStylesController {
    constructor(private readonly artStylesService: ArtStylesService) {}

    @Get()
    findAll(): Promise<IArtStyle[]> {
        return this.artStylesService.findAllActive();
    }
}

import { Controller, Get } from '@nestjs/common';
import type { ArtStyle } from '../../generated/prisma/client.js';
import { ArtStylesService } from './art-styles.service.js';

@Controller('art-styles')
export class ArtStylesController {
    constructor(private readonly artStylesService: ArtStylesService) {}

    @Get()
    findAll(): Promise<ArtStyle[]> {
        return this.artStylesService.findAllActive();
    }
}

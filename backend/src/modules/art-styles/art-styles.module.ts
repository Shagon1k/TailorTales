import { Module } from '@nestjs/common';
import { ArtStylesController } from './art-styles.controller.js';
import { ArtStylesService } from './art-styles.service.js';

@Module({
    controllers: [ArtStylesController],
    providers: [ArtStylesService],
})
export class ArtStylesModule {}

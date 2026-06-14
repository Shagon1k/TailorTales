import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { AdminArtStylesController } from './admin-art-styles.controller.js';
import { ArtStylesController } from './art-styles.controller.js';
import { ArtStylesService } from './art-styles.service.js';

@Module({
    imports: [AiModule],
    controllers: [ArtStylesController, AdminArtStylesController],
    providers: [ArtStylesService],
})
export class ArtStylesModule {}

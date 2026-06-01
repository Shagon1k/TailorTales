import { Module } from '@nestjs/common';
import { GenerationModule } from '../generation/generation.module.js';
import { StoriesController } from './stories.controller.js';
import { StoriesService } from './stories.service.js';

@Module({
    imports: [GenerationModule],
    controllers: [StoriesController],
    providers: [StoriesService],
})
export class StoriesModule {}

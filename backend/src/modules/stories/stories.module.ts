import { Module } from '@nestjs/common';
import { GenerationModule } from '../generation/generation.module.js';
import { RegenerationModule } from '../regeneration/regeneration.module.js';
import { RenderingModule } from '../rendering/rendering.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { StoriesController } from './stories.controller.js';
import { StoriesService } from './stories.service.js';

@Module({
    imports: [GenerationModule, RegenerationModule, RenderingModule, SubscriptionsModule],
    controllers: [StoriesController],
    providers: [StoriesService],
})
export class StoriesModule {}

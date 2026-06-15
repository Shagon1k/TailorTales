import { Module } from '@nestjs/common';
import { GenerationModule } from '../generation/generation.module.js';
import { RatingsModule } from '../ratings/ratings.module.js';
import { RegenerationModule } from '../regeneration/regeneration.module.js';
import { RenderingModule } from '../rendering/rendering.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { AdminStoriesController } from './admin-stories.controller.js';
import { StoriesController } from './stories.controller.js';
import { StoriesService } from './stories.service.js';

@Module({
    imports: [
        GenerationModule,
        RatingsModule,
        RegenerationModule,
        RenderingModule,
        SubscriptionsModule,
    ],
    controllers: [StoriesController, AdminStoriesController],
    providers: [StoriesService],
})
export class StoriesModule {}

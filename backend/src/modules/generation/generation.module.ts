import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module.js';
import { RenderingModule } from '../rendering/rendering.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { GenerationService } from './generation.service.js';
import { GenerationPipeline } from './generation.pipeline.js';
import { GenerationWorker } from './generation.worker.js';
import { StoryPromptBuilder } from './story-prompt-builder.js';
import { StoryPlanValidator } from './story-plan.validator.js';
import { GENERATION_QUEUE } from './generation.constants.js';

@Module({
    imports: [
        BullModule.registerQueue({ name: GENERATION_QUEUE }),
        AiModule,
        RenderingModule,
        StorageModule,
        NotificationsModule,
        SubscriptionsModule,
    ],
    providers: [
        GenerationService,
        GenerationPipeline,
        GenerationWorker,
        StoryPromptBuilder,
        StoryPlanValidator,
    ],
    exports: [GenerationService],
})
export class GenerationModule {}

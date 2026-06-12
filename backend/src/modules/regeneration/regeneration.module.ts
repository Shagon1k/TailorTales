import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { RenderingModule } from '../rendering/rendering.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { RegenerationService } from './regeneration.service.js';

@Module({
    imports: [AiModule, RenderingModule, StorageModule, SubscriptionsModule],
    providers: [RegenerationService],
    exports: [RegenerationService],
})
export class RegenerationModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PricingTiersModule } from '../pricing-tiers/pricing-tiers.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { FreeTierResetCron } from './free-tier-reset.cron.js';
import { RetentionCleanupCron } from './retention-cleanup.cron.js';
import { QuotaService } from './quota.service.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
    imports: [PrismaModule, PricingTiersModule, StorageModule],
    controllers: [SubscriptionsController],
    providers: [SubscriptionsService, QuotaService, FreeTierResetCron, RetentionCleanupCron],
    exports: [SubscriptionsService, QuotaService],
})
export class SubscriptionsModule {}

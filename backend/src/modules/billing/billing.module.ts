import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { PricingTiersModule } from '../pricing-tiers/pricing-tiers.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { BillingController } from './billing.controller.js';
import { BillingWebhookService } from './billing-webhook.service.js';
import { PADDLE_CLIENT } from './billing.types.js';
import { PaddleApiClient } from './paddle-api.client.js';
import { PaddleStubClient } from './paddle-stub.client.js';
import { WebhookController } from './webhook.controller.js';

@Module({
    imports: [PrismaModule, PricingTiersModule, SubscriptionsModule, NotificationsModule],
    controllers: [WebhookController, BillingController],
    providers: [
        PaddleStubClient,
        BillingWebhookService,
        {
            provide: PADDLE_CLIENT,
            inject: [ConfigService, PaddleStubClient],
            useFactory: (config: ConfigService, stub: PaddleStubClient) =>
                // The real client is constructed lazily so missing PADDLE_* env vars
                // only fail boot when stubs are off (it reads config in its constructor).
                config.get<boolean>('USE_PADDLE_STUBS') ? stub : new PaddleApiClient(config),
        },
    ],
    exports: [PADDLE_CLIENT],
})
export class BillingModule {}

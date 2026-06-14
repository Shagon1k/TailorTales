import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { ArtStylesModule } from './modules/art-styles/art-styles.module.js';
import { StoriesModule } from './modules/stories/stories.module.js';
import { StoryBlueprintsModule } from './modules/story-blueprints/story-blueprints.module.js';
import { ChildrenModule } from './modules/children/children.module.js';
import { CharactersModule } from './modules/characters/characters.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { RenderingModule } from './modules/rendering/rendering.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { ContactModule } from './modules/contact/contact.module.js';
import { EmailModule } from './modules/email/email.module.js';
import { GenerationModule } from './modules/generation/generation.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { PricingTiersModule } from './modules/pricing-tiers/pricing-tiers.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { RatingsModule } from './modules/ratings/ratings.module.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
        ScheduleModule.forRoot(),
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: { url: config.getOrThrow<string>('REDIS_URL') },
            }),
        }),
        PrismaModule,
        StorageModule,
        RenderingModule,
        AiModule,
        EmailModule,
        NotificationsModule,
        ContactModule,
        GenerationModule,
        AuthModule,
        ChildrenModule,
        CharactersModule,
        ArtStylesModule,
        StoriesModule,
        StoryBlueprintsModule,
        PricingTiersModule,
        SubscriptionsModule,
        BillingModule,
        RatingsModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}

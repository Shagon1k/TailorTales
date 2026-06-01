import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard.js';
import { ArtStylesModule } from './modules/art-styles/art-styles.module.js';
import { StoriesModule } from './modules/stories/stories.module.js';
import { StoryBlueprintsModule } from './modules/story-blueprints/story-blueprints.module.js';
import { ChildrenModule } from './modules/children/children.module.js';
import { StorageModule } from './modules/storage/storage.module.js';
import { RenderingModule } from './modules/rendering/rendering.module.js';
import { AiModule } from './modules/ai/ai.module.js';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: validateEnv,
        }),
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
        AuthModule,
        ChildrenModule,
        ArtStylesModule,
        StoriesModule,
        StoryBlueprintsModule,
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

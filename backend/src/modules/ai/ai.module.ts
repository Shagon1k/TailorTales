import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClient } from './ai.client.js';
import { AiStubClient } from './ai-stub.client.js';
import { AI_CLIENT } from './ai.types.js';

@Module({
    providers: [
        AiClient,
        AiStubClient,
        {
            provide: AI_CLIENT,
            inject: [ConfigService, AiClient, AiStubClient],
            useFactory: (config: ConfigService, real: AiClient, stub: AiStubClient) =>
                config.get<boolean>('USE_AI_STUBS') ? stub : real,
        },
    ],
    exports: [AI_CLIENT],
})
export class AiModule {}

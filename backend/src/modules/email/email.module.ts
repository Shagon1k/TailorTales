import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResendClient } from './resend.client.js';
import { EmailStubClient } from './email-stub.client.js';
import { EMAIL_CLIENT } from './email.types.js';

@Module({
    providers: [
        ResendClient,
        EmailStubClient,
        {
            provide: EMAIL_CLIENT,
            inject: [ConfigService, ResendClient, EmailStubClient],
            useFactory: (config: ConfigService, real: ResendClient, stub: EmailStubClient) =>
                config.get<boolean>('USE_AI_STUBS') ? stub : real,
        },
    ],
    exports: [EMAIL_CLIENT],
})
export class EmailModule {}

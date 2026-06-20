import {
    BadRequestException,
    Controller,
    Headers,
    HttpCode,
    Inject,
    Logger,
    Post,
    Req,
    type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator.js';
import { BillingWebhookService } from './billing-webhook.service.js';
import { PADDLE_CLIENT, type IPaddleClient } from './billing.types.js';

@Controller('webhooks')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(
        @Inject(PADDLE_CLIENT) private readonly paddle: IPaddleClient,
        private readonly webhookService: BillingWebhookService,
    ) {}

    @Public()
    @SkipThrottle()
    @Post('paddle')
    @HttpCode(200)
    async handlePaddleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('paddle-signature') signature: string | undefined,
    ): Promise<{ received: boolean }> {
        if (!req.rawBody) {
            throw new BadRequestException('Missing request body');
        }

        let event;
        try {
            event = await this.paddle.verifyAndParseWebhook(req.rawBody, signature ?? '');
        } catch (err: unknown) {
            this.logger.warn(
                `Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`,
            );
            throw new BadRequestException('Invalid webhook signature');
        }

        // Handled and ignored events both return 200. A thrown handler error
        // (e.g. transient DB failure) surfaces as 500 so Paddle retries —
        // handlers are idempotent, so redelivery is safe.
        await this.webhookService.handleEvent(event);

        return { received: true };
    }
}

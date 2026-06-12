import { Injectable, Logger } from '@nestjs/common';
import type { IInvoice, IPaddleClient, IPaddleEvent } from './billing.types.js';

/**
 * Offline stand-in for the Paddle API (USE_PADDLE_STUBS=true).
 * Webhook "verification" just parses the JSON body, so the full webhook flow
 * can be exercised locally with `curl -d @fixture.json /webhooks/paddle`.
 */
@Injectable()
export class PaddleStubClient implements IPaddleClient {
    private readonly logger = new Logger(PaddleStubClient.name);

    async verifyAndParseWebhook(rawBody: Buffer): Promise<IPaddleEvent> {
        // Fixtures use the internal IPaddleEvent shape (camelCase) — the real SDK
        // owns the snake_case wire-format mapping, the stub doesn't replicate it.
        const event = JSON.parse(rawBody.toString('utf8')) as IPaddleEvent;
        return event;
    }

    async cancelSubscription(paddleSubscriptionId: string): Promise<void> {
        this.logger.log(`[stub] cancelSubscription(${paddleSubscriptionId})`);
    }

    async createPortalSession(paddleCustomerId: string): Promise<{ url: string }> {
        this.logger.log(`[stub] createPortalSession(${paddleCustomerId})`);
        return { url: 'https://stub.paddle.test/portal' };
    }

    async listInvoices(): Promise<IInvoice[]> {
        return [
            {
                date: '2026-05-11T10:00:00.000Z',
                description: 'Story Hour',
                amount: 500,
                currency: 'EUR',
                status: 'paid',
                invoicePdfUrl: 'https://stub.paddle.test/invoice-1.pdf',
            },
            {
                date: '2026-06-11T10:00:00.000Z',
                description: 'Story Hour',
                amount: 500,
                currency: 'EUR',
                status: 'paid',
                invoicePdfUrl: 'https://stub.paddle.test/invoice-2.pdf',
            },
        ];
    }
}

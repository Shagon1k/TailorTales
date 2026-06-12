import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import type { IInvoice, IPaddleClient, IPaddleEvent } from './billing.types.js';

@Injectable()
export class PaddleApiClient implements IPaddleClient {
    private readonly paddle: Paddle;
    private readonly webhookSecret: string;

    constructor(config: ConfigService) {
        // Fail at boot, not at first request — these are required when stubs are off.
        const apiKey = config.getOrThrow<string>('PADDLE_API_KEY');
        this.webhookSecret = config.getOrThrow<string>('PADDLE_WEBHOOK_SECRET');
        const environment =
            config.get<string>('PADDLE_ENVIRONMENT') === 'production'
                ? Environment.production
                : Environment.sandbox;

        this.paddle = new Paddle(apiKey, { environment });
    }

    async verifyAndParseWebhook(rawBody: Buffer, signature: string): Promise<IPaddleEvent> {
        // unmarshal verifies the HMAC signature and throws on mismatch
        const event = await this.paddle.webhooks.unmarshal(
            rawBody.toString('utf8'),
            this.webhookSecret,
            signature,
        );

        // The SDK returns typed event classes; reduce to the shape handlers consume.
        const data = event.data as IPaddleEvent['data'];
        return { eventType: event.eventType, data };
    }

    async cancelSubscription(paddleSubscriptionId: string): Promise<void> {
        await this.paddle.subscriptions.cancel(paddleSubscriptionId, {
            effectiveFrom: 'next_billing_period',
        });
    }

    async createPortalSession(paddleCustomerId: string): Promise<{ url: string }> {
        const session = await this.paddle.customerPortalSessions.create(paddleCustomerId, []);
        return { url: session.urls.general.overview };
    }

    async listInvoices(paddleCustomerId: string): Promise<IInvoice[]> {
        const collection = this.paddle.transactions.list({
            customerId: [paddleCustomerId],
            status: ['billed', 'paid', 'completed', 'past_due'],
        });

        const invoices: IInvoice[] = [];
        for (const txn of await collection.next()) {
            invoices.push({
                date: txn.billedAt ?? txn.createdAt,
                description: txn.details?.lineItems?.[0]?.product?.name ?? 'Subscription',
                amount: Number(txn.details?.totals?.total ?? 0),
                currency: txn.currencyCode,
                status: txn.status,
                invoicePdfUrl: txn.invoiceNumber
                    ? (await this.paddle.transactions.getInvoicePDF(txn.id)).url
                    : null,
            });
        }
        return invoices;
    }
}

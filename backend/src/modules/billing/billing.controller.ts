import { ConflictException, Controller, Get, Inject, Post } from '@nestjs/common';
import { type User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { PADDLE_CLIENT, type IInvoice, type IPaddleClient } from './billing.types.js';

@Controller('billing')
export class BillingController {
    constructor(
        @Inject(PADDLE_CLIENT) private readonly paddle: IPaddleClient,
        private readonly subscriptions: SubscriptionsService,
    ) {}

    /**
     * Schedules cancellation at the end of the current billing period.
     * The tier downgrade itself happens when Paddle later emits
     * subscription.canceled — this call only starts the clock.
     */
    @Post('cancel')
    async cancel(@CurrentUser() user: User): Promise<{ scheduled: boolean }> {
        const subscription = await this.subscriptions.getOrCreateForUser(user.id);
        if (!subscription.paddleSubscriptionId) {
            throw new ConflictException('No paid subscription to cancel');
        }

        await this.paddle.cancelSubscription(subscription.paddleSubscriptionId);
        await this.subscriptions.markCancelScheduled(subscription.userId);
        return { scheduled: true };
    }

    /** Paddle-hosted billing portal (payment method change, plan change). */
    @Post('portal')
    async createPortalSession(@CurrentUser() user: User): Promise<{ url: string }> {
        const subscription = await this.subscriptions.getOrCreateForUser(user.id);
        if (!subscription.paddleCustomerId) {
            throw new ConflictException('No Paddle billing profile for this account');
        }

        return this.paddle.createPortalSession(subscription.paddleCustomerId);
    }

    @Get('invoices')
    async listInvoices(@CurrentUser() user: User): Promise<IInvoice[]> {
        const subscription = await this.subscriptions.getOrCreateForUser(user.id);
        if (!subscription.paddleCustomerId) {
            return [];
        }

        return this.paddle.listInvoices(subscription.paddleCustomerId);
    }
}

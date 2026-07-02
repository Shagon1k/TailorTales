import { ConflictException, Controller, Get, Inject, Logger, Post } from '@nestjs/common';
import { type User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PricingTiersService } from '../pricing-tiers/pricing-tiers.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import {
    PADDLE_CLIENT,
    type IInvoice,
    type IPaddleClient,
    type IPaddleSubscriptionSnapshot,
} from './billing.types.js';

@Controller('billing')
export class BillingController {
    private readonly logger = new Logger(BillingController.name);

    constructor(
        @Inject(PADDLE_CLIENT) private readonly paddle: IPaddleClient,
        private readonly subscriptions: SubscriptionsService,
        private readonly pricingTiers: PricingTiersService,
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
            throw new ConflictException('errors.billing.noActiveSubscription');
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
            throw new ConflictException('errors.billing.noBillingProfile');
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

    /**
     * Recovery path for successful checkout when the webhook is delayed or missed.
     * Webhooks remain the normal source of truth; this only reconciles Paddle
     * subscriptions that explicitly carry this user's customData.userId.
     */
    @Post('sync')
    async syncSubscription(@CurrentUser() user: User): Promise<{ synced: boolean }> {
        const localSubscription = await this.subscriptions.getOrCreateForUser(user.id);
        const customerIds = await this.getCandidateCustomerIds(user.email, localSubscription);
        const subscriptions = (
            await Promise.all(
                customerIds.map((customerId) => this.paddle.listSubscriptions(customerId)),
            )
        ).flat();

        const paddleSubscription = this.pickLatestOwnedSubscription(user.id, subscriptions);
        if (!paddleSubscription) {
            return { synced: false };
        }

        const priceId = paddleSubscription.items[0]?.price?.id;
        if (!priceId) {
            this.logger.warn(`Paddle subscription ${paddleSubscription.id} has no price id`);
            return { synced: false };
        }

        const tier = await this.pricingTiers.findByPaddlePriceId(priceId);
        if (!tier) {
            this.logger.warn(
                `Paddle subscription ${paddleSubscription.id} uses unknown price ${priceId}`,
            );
            return { synced: false };
        }

        await this.subscriptions.applyPaddleSubscription(user.id, {
            pricingTierId: tier.id,
            paddleSubscriptionId: paddleSubscription.id,
            paddleCustomerId: paddleSubscription.customerId,
            status: paddleSubscription.status === 'past_due' ? 'PAST_DUE' : 'ACTIVE',
            cancelAtPeriodEnd: paddleSubscription.scheduledChange?.action === 'cancel',
            currentPeriodEnd: paddleSubscription.currentBillingPeriod?.endsAt
                ? new Date(paddleSubscription.currentBillingPeriod.endsAt)
                : null,
        });

        await this.cancelOverlappingSubscriptions(user.id, subscriptions, paddleSubscription.id);

        this.logger.log(
            `Synced Paddle subscription ${paddleSubscription.id} for user ${user.id} (${tier.name})`,
        );
        return { synced: true };
    }

    private async getCandidateCustomerIds(
        email: string,
        localSubscription: Awaited<ReturnType<SubscriptionsService['getOrCreateForUser']>>,
    ): Promise<string[]> {
        const ids = new Set<string>();
        if (localSubscription.paddleCustomerId) {
            ids.add(localSubscription.paddleCustomerId);
        }

        const customers = await this.paddle.findCustomersByEmail(email);
        customers.forEach((customer) => ids.add(customer.id));

        return [...ids];
    }

    private pickLatestOwnedSubscription(
        userId: string,
        subscriptions: IPaddleSubscriptionSnapshot[],
    ): IPaddleSubscriptionSnapshot | null {
        const ownedActiveSubscriptions = subscriptions.filter(
            (subscription) =>
                subscription.customData?.userId === userId &&
                (subscription.status === 'active' || subscription.status === 'past_due'),
        );

        if (ownedActiveSubscriptions.length === 0) {
            return null;
        }

        return [...ownedActiveSubscriptions].sort(
            (left, right) =>
                this.getSubscriptionSortTime(right) - this.getSubscriptionSortTime(left),
        )[0];
    }

    private getSubscriptionSortTime(subscription: IPaddleSubscriptionSnapshot): number {
        const sortDate = subscription.currentBillingPeriod?.startsAt ?? subscription.createdAt;
        return new Date(sortDate).getTime();
    }

    private async cancelOverlappingSubscriptions(
        userId: string,
        subscriptions: IPaddleSubscriptionSnapshot[],
        activeSubscriptionId: string,
    ): Promise<void> {
        const overlappingSubscriptions = subscriptions.filter(
            (subscription) =>
                subscription.id !== activeSubscriptionId &&
                subscription.customData?.userId === userId &&
                (subscription.status === 'active' || subscription.status === 'past_due') &&
                subscription.scheduledChange?.action !== 'cancel',
        );

        await Promise.all(
            overlappingSubscriptions.map(async (subscription) => {
                await this.paddle.cancelSubscription(subscription.id);
                this.logger.log(
                    `Scheduled cancellation for overlapping Paddle subscription ${subscription.id}`,
                );
            }),
        );
    }
}

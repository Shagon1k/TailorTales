import { ForbiddenException, Injectable } from '@nestjs/common';
import type { ILocalizedErrorBody } from '../../common/error-translations.js';
import type { Prisma, StoryType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CREDITS_PER_PAGE } from './subscriptions.constants.js';
import { SubscriptionsService } from './subscriptions.service.js';

/**
 * Single quota authority for the whole app: page credits, regenerations,
 * children limit, and the watermark flag — all read from the user's
 * Subscription + PricingTier. Checks happen before an operation; deductions
 * happen only after it succeeds (no reservations — the 1-active-job-per-user
 * rule bounds any overshoot).
 */
@Injectable()
export class QuotaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptions: SubscriptionsService,
    ) {}

    async assertPageCredits(userId: string, pageCount: number, type: StoryType): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        const cost = pageCount * CREDITS_PER_PAGE[type];
        const limit = subscription.pricingTier.pagesPerMonth;

        if (subscription.pagesUsed + cost > limit) {
            throw new ForbiddenException({
                code: 'errors.quota.pageCreditsExceeded',
                params: { cost, remaining: Math.max(limit - subscription.pagesUsed, 0), limit },
            } satisfies ILocalizedErrorBody);
        }
    }

    async deductPageCredits(userId: string, pageCount: number, type: StoryType): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        const cost = pageCount * CREDITS_PER_PAGE[type];

        await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: { pagesUsed: { increment: cost } },
        });
    }

    async assertRegenerationCredit(userId: string): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        const limit = subscription.pricingTier.regenerationsPerMonth;

        if (subscription.regenerationsUsed >= limit) {
            throw new ForbiddenException({
                code: 'errors.quota.regenerationsExceeded',
                params: { limit },
            } satisfies ILocalizedErrorBody);
        }
    }

    /** Accepts an open transaction so callers can record usage atomically with their own writes. */
    async recordRegeneration(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);

        await (tx ?? this.prisma).subscription.update({
            where: { id: subscription.id },
            data: { regenerationsUsed: { increment: 1 } },
        });
    }

    async assertCharacterLimit(userId: string): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        const limit = subscription.pricingTier.charactersLimit;

        if (limit === null) {
            return;
        }

        const characterCount = await this.prisma.character.count({ where: { userId } });
        if (characterCount >= limit) {
            throw new ForbiddenException({
                code: 'errors.quota.charactersExceeded',
                params: { limit },
            } satisfies ILocalizedErrorBody);
        }
    }

    async assertCharacterGenerationCredit(userId: string): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        const limit = subscription.pricingTier.characterGenerationsPerMonth;

        if (subscription.characterGenerationsUsed >= limit) {
            throw new ForbiddenException({
                code: 'errors.quota.characterGenerationsExceeded',
                params: { limit },
            } satisfies ILocalizedErrorBody);
        }
    }

    async recordCharacterGeneration(userId: string, tx?: Prisma.TransactionClient): Promise<void> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);

        await (tx ?? this.prisma).subscription.update({
            where: { id: subscription.id },
            data: { characterGenerationsUsed: { increment: 1 } },
        });
    }

    async getWatermarkForUser(userId: string): Promise<boolean> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        return subscription.pricingTier.watermark;
    }
}

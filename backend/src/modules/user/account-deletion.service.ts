import { BadGatewayException, Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PADDLE_CLIENT, type IPaddleClient } from '../billing/billing.types.js';
import { StorageService } from '../storage/storage.service.js';

/**
 * GDPR account deletion (Art. 17), strict order:
 *   1. Cancel any live Paddle subscription — abort on failure (never leave a
 *      billing relationship attached to a deleted account).
 *   2. Delete every S3 object under the user's prefix. The S3 listing is the
 *      source of truth for what to delete (robust against orphans); the
 *      DB-derived key set is computed for the expected-vs-actual audit log.
 *   3. Delete the User row — all relations cascade (Subscription included).
 */
@Injectable()
export class AccountDeletionService {
    private readonly logger = new Logger(AccountDeletionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
        @Inject(PADDLE_CLIENT) private readonly paddle: IPaddleClient,
    ) {}

    async deleteAccount(userId: string): Promise<void> {
        // 1. Paddle first — if this fails, nothing has been deleted yet.
        const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
        if (subscription?.paddleSubscriptionId && !subscription.cancelAtPeriodEnd) {
            try {
                await this.paddle.cancelSubscription(subscription.paddleSubscriptionId);
            } catch (err: unknown) {
                this.logger.error(
                    `Paddle cancel failed for user ${userId} (${subscription.paddleSubscriptionId}): ${err instanceof Error ? err.message : String(err)}`,
                );
                throw new BadGatewayException(
                    'Could not cancel the subscription with our payment provider — account not deleted, please retry',
                );
            }
        }

        // 2. S3 cleanup with expected-vs-actual audit
        const expectedKeys = await this.collectExpectedKeys(userId);
        const listedKeys = await this.storage.listKeys(`users/${userId}/`);
        const { requested, deleted } = await this.storage.deleteMany(listedKeys);

        const auditLine = `Account deletion ${userId}: expected(DB)=${expectedKeys.length} listed(S3)=${requested} deleted=${deleted}`;
        if (deleted < requested || requested < expectedKeys.length) {
            this.logger.warn(auditLine);
        } else {
            this.logger.log(auditLine);
        }

        // 3. DB rows — every relation cascades from User
        await this.prisma.user.delete({ where: { id: userId } });

        this.logger.log(`Account ${userId} deleted`);
    }

    /** Every asset key recorded in the DB for this user — the audit baseline. */
    private async collectExpectedKeys(userId: string): Promise<string[]> {
        const [stories, pages, characters] = await Promise.all([
            this.prisma.story.findMany({
                where: { userId },
                select: { pdfKey: true, coverImageKey: true },
            }),
            this.prisma.page.findMany({
                where: { story: { userId } },
                select: { illustrations: true },
            }),
            this.prisma.character.findMany({
                where: { userId },
                select: { previewKey: true },
            }),
        ]);

        return [
            ...stories.flatMap((s) => [s.pdfKey, s.coverImageKey]),
            ...pages.flatMap((p) => {
                const illustrations = p.illustrations as Array<{ key: string }> | null;
                return illustrations?.map((i) => i.key) ?? [];
            }),
            ...characters.map((c) => c.previewKey),
        ].filter((key): key is string => Boolean(key));
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Billing-anniversary usage reset for free-tier subscriptions.
 * Runs daily and resets any free subscription whose currentPeriodEnd has passed,
 * then advances currentPeriodEnd by one month — matching paid-tier webhook behavior.
 * Paid tiers are reset by the subscription.updated webhook when the period advances.
 */
@Injectable()
export class FreeTierResetCron {
    private readonly logger = new Logger(FreeTierResetCron.name);

    constructor(private readonly prisma: PrismaService) {}

    @Cron('0 3 * * *') // 03:00 daily
    async resetFreeTierUsage(): Promise<void> {
        const due = await this.prisma.subscription.findMany({
            where: { paddleSubscriptionId: null, currentPeriodEnd: { lte: new Date() } },
            select: { id: true, currentPeriodEnd: true },
        });

        await Promise.all(
            due.map((sub) => {
                const next = new Date(sub.currentPeriodEnd!);
                next.setMonth(next.getMonth() + 1);
                return this.prisma.subscription.update({
                    where: { id: sub.id },
                    data: { pagesUsed: 0, regenerationsUsed: 0, currentPeriodEnd: next },
                });
            }),
        );

        this.logger.log(`Free-tier cycle reset: ${due.length} subscription(s) reset`);
    }
}

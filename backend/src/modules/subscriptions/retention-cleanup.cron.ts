import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../storage/storage.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deletes generated assets (PDF, cover, page illustrations) of stories past
 * their tier's retentionDays. Story metadata rows are kept — only the S3
 * objects and their key columns are cleared. A non-null pdfKey doubles as
 * the "not yet purged" marker.
 */
@Injectable()
export class RetentionCleanupCron {
    private readonly logger = new Logger(RetentionCleanupCron.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    @Cron('0 4 * * *') // daily at 04:00
    async cleanupExpiredStories(): Promise<void> {
        const candidates = await this.prisma.story.findMany({
            where: {
                status: 'COMPLETED',
                pdfKey: { not: null },
                user: {
                    subscription: {
                        pricingTier: { retentionDays: { not: null } },
                    },
                },
            },
            include: {
                pages: { select: { id: true, illustrations: true } },
                user: {
                    select: {
                        subscription: {
                            select: { pricingTier: { select: { retentionDays: true } } },
                        },
                    },
                },
            },
        });

        const now = Date.now();
        const expired = candidates.filter((story) => {
            const retentionDays = story.user.subscription?.pricingTier.retentionDays;
            if (retentionDays == null) return false;
            return now - story.updatedAt.getTime() > retentionDays * DAY_MS;
        });

        if (expired.length === 0) return;

        for (const story of expired) {
            const keys = [
                story.pdfKey,
                story.coverImageKey,
                ...story.pages.flatMap((page) => {
                    const illustrations = page.illustrations as Array<{ key: string }> | null;
                    return illustrations?.map((i) => i.key) ?? [];
                }),
            ].filter((key): key is string => Boolean(key));

            let deleted = 0;
            for (const key of keys) {
                try {
                    await this.storage.delete(key);
                    deleted++;
                } catch (err: unknown) {
                    this.logger.warn(
                        `Retention cleanup: failed to delete ${key}: ${err instanceof Error ? err.message : String(err)}`,
                    );
                }
            }

            await this.prisma.story.update({
                where: { id: story.id },
                data: { pdfKey: null, coverImageKey: null },
            });
            await this.prisma.page.updateMany({
                where: { storyId: story.id },
                data: { illustrations: [] },
            });

            const logLine = `Retention cleanup: story ${story.id} expected=${keys.length} deleted=${deleted}`;
            if (deleted < keys.length) {
                this.logger.warn(logLine);
            } else {
                this.logger.log(logLine);
            }
        }
    }
}

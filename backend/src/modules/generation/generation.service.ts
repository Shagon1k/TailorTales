import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    type MessageEvent,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { QuotaService } from '../subscriptions/quota.service.js';
import { GENERATION_QUEUE } from './generation.constants.js';

const SSE_POLL_INTERVAL_MS = 800;

export interface IProgressSnapshot {
    jobId: string;
    stage: string | null;
    status: string;
    completedPages: number;
    totalPages: number;
    error: string | null;
}

@Injectable()
export class GenerationService {
    private readonly logger = new Logger(GenerationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly quotaService: QuotaService,
        @InjectQueue(GENERATION_QUEUE) private readonly queue: Queue,
    ) {}

    async enqueue(storyId: string, userId: string): Promise<{ jobId: string; storyId: string }> {
        const story = await this.prisma.story.findFirst({ where: { id: storyId, userId } });
        if (!story) throw new NotFoundException(`Story ${storyId} not found`);
        if (story.status !== 'DRAFT') {
            throw new ConflictException(`Story must be in DRAFT status to generate`);
        }

        // Quota check before any Job exists; deduction happens at the Ready stage.
        await this.quotaService.assertPageCredits(userId, story.pageCount, story.type);

        // One active generation per user — check PENDING + ACTIVE via Story.userId join
        const activeJob = await this.prisma.job.findFirst({
            where: {
                status: { in: ['PENDING', 'ACTIVE'] },
                story: { userId },
            },
        });
        if (activeJob) {
            throw new ConflictException('A generation is already in progress for this account');
        }

        const job = await this.prisma.job.create({
            data: { storyId, type: 'GENERATION', status: 'PENDING' },
        });

        await this.prisma.story.update({
            where: { id: storyId },
            data: { status: 'QUEUED' },
        });

        await this.queue.add('generate', { jobId: job.id }, { jobId: job.id });

        return { jobId: job.id, storyId };
    }

    async getActiveJob(userId: string): Promise<{ jobId: string; storyId: string } | null> {
        const job = await this.prisma.job.findFirst({
            where: {
                status: { in: ['PENDING', 'ACTIVE'] },
                story: { userId },
            },
            select: { id: true, storyId: true },
        });

        if (!job) return null;
        return { jobId: job.id, storyId: job.storyId };
    }

    streamProgress(storyId: string, userId: string): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            let previousStage: string | null = null;
            let previousCompletedPages = -1;
            let totalPages = 0;
            let done = false;

            // Ownership check + totalPages run once at subscription start — these
            // don't change during a generation, no need to re-query each poll.
            const init = async (): Promise<boolean> => {
                const story = await this.prisma.story.findFirst({
                    where: { id: storyId, userId },
                    select: { pageCount: true },
                });
                if (!story) {
                    subscriber.error(new Error(`Story ${storyId} not found`));
                    return false;
                }
                totalPages = story.pageCount;
                return true;
            };

            const poll = async (): Promise<void> => {
                if (done) return;

                try {
                    const snapshot = await this.readSnapshot(storyId, totalPages);
                    if (!snapshot) {
                        subscriber.error(new Error(`No job found for story ${storyId}`));
                        done = true;
                        return;
                    }

                    const isFirstPoll = previousCompletedPages === -1;
                    const stageChanged = snapshot.stage !== previousStage;
                    // On first poll start from 0 so already-completed pages are replayed.
                    const baseline = isFirstPoll ? 0 : previousCompletedPages;
                    const newPages = snapshot.completedPages - baseline;

                    if (isFirstPoll || stageChanged) {
                        subscriber.next({ data: { type: 'snapshot', ...snapshot } });
                        previousStage = snapshot.stage;
                    }

                    if (newPages > 0) {
                        for (let i = 0; i < newPages; i++) {
                            const pageOrder = baseline + i + 1;
                            subscriber.next({
                                data: { type: 'page_complete', pageOrder, ...snapshot },
                            });
                        }
                    }
                    previousCompletedPages = snapshot.completedPages;

                    if (snapshot.status === 'COMPLETED') {
                        subscriber.next({ data: { type: 'completed', ...snapshot } });
                        subscriber.complete();
                        done = true;
                    } else if (snapshot.status === 'FAILED') {
                        subscriber.next({ data: { type: 'failed', ...snapshot } });
                        subscriber.complete();
                        done = true;
                    }
                } catch (err: unknown) {
                    this.logger.error(`SSE poll error for story ${storyId}`, err);
                }
            };

            let timer: NodeJS.Timeout | undefined;
            init().then((ok) => {
                if (!ok || done) return;
                poll();
                timer = setInterval(() => poll(), SSE_POLL_INTERVAL_MS);
            });

            return () => {
                done = true;
                if (timer) clearInterval(timer);
            };
        });
    }

    /**
     * Single query that returns the latest job + a count of pages with illustrations.
     * Combines two reads into one DB round-trip via a correlated subquery.
     */
    private async readSnapshot(
        storyId: string,
        totalPages: number,
    ): Promise<IProgressSnapshot | null> {
        const rows = await this.prisma.$queryRaw<
            Array<{
                id: string;
                stage: string | null;
                status: string;
                error: string | null;
                completedPages: number;
            }>
        >`
            SELECT
                j.id,
                j.stage,
                j.status::text AS status,
                j.error,
                (
                    SELECT COUNT(*)::int
                    FROM "Page"
                    WHERE "storyId" = ${storyId}
                      AND jsonb_array_length(illustrations) > 0
                ) AS "completedPages"
            FROM "Job" j
            WHERE j."storyId" = ${storyId}
            ORDER BY j."createdAt" DESC
            LIMIT 1
        `;

        const row = rows[0];
        if (!row) return null;

        return {
            jobId: row.id,
            stage: row.stage,
            status: row.status,
            completedPages: row.completedPages,
            totalPages,
            error: row.error,
        };
    }
}

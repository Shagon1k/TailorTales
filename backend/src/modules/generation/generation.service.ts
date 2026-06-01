import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GENERATION_QUEUE } from './generation.constants.js';

@Injectable()
export class GenerationService {
    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue(GENERATION_QUEUE) private readonly queue: Queue,
    ) {}

    async enqueue(storyId: string, userId: string): Promise<{ jobId: string }> {
        const story = await this.prisma.story.findFirst({ where: { id: storyId, userId } });
        if (!story) throw new NotFoundException(`Story ${storyId} not found`);
        if (story.status !== 'DRAFT') {
            throw new ConflictException(`Story must be in DRAFT status to generate`);
        }

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

        return { jobId: job.id };
    }
}

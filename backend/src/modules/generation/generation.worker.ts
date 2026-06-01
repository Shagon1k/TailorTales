import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { GenerationPipeline } from './generation.pipeline.js';
import { GENERATION_QUEUE } from './generation.constants.js';

@Processor(GENERATION_QUEUE)
export class GenerationWorker extends WorkerHost {
    constructor(private readonly pipeline: GenerationPipeline) {
        super();
    }

    async process(job: Job<{ jobId: string }>): Promise<void> {
        return this.pipeline.run(job.data.jobId);
    }
}

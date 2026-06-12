import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { GenerationService } from '../generation.service.js';
import { GENERATION_QUEUE } from '../generation.constants.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { QuotaService } from '../../subscriptions/quota.service.js';

const mockQueue = { add: vi.fn().mockResolvedValue({}) };
const mockQuota = { assertPageCredits: vi.fn().mockResolvedValue(undefined) };

const mockPrisma = {
    story: { findFirst: vi.fn(), update: vi.fn() },
    job: { findFirst: vi.fn(), create: vi.fn() },
};

describe('GenerationService', () => {
    let service: GenerationService;

    beforeEach(async () => {
        vi.clearAllMocks();

        const module = await Test.createTestingModule({
            providers: [
                GenerationService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: QuotaService, useValue: mockQuota },
                { provide: getQueueToken(GENERATION_QUEUE), useValue: mockQueue },
            ],
        }).compile();

        service = module.get(GenerationService);
    });

    describe('enqueue', () => {
        describe('given a valid DRAFT story with no active jobs', () => {
            it('should create a job, update story to QUEUED, and return jobId', async () => {
                mockPrisma.story.findFirst.mockResolvedValue({
                    id: 's1',
                    status: 'DRAFT',
                    userId: 'u1',
                });
                mockPrisma.job.findFirst.mockResolvedValue(null);
                mockPrisma.job.create.mockResolvedValue({ id: 'job-1' });
                mockPrisma.story.update.mockResolvedValue({});

                const result = await service.enqueue('s1', 'u1');

                expect(result.jobId).toBe('job-1');
                expect(mockPrisma.story.update).toHaveBeenCalledWith({
                    where: { id: 's1' },
                    data: { status: 'QUEUED' },
                });
                expect(mockQueue.add).toHaveBeenCalledWith(
                    'generate',
                    { jobId: 'job-1' },
                    { jobId: 'job-1' },
                );
            });
        });

        describe('given the user lacks page credits', () => {
            it('should throw ForbiddenException before creating any Job', async () => {
                mockPrisma.story.findFirst.mockResolvedValue({
                    id: 's1',
                    status: 'DRAFT',
                    userId: 'u1',
                    pageCount: 12,
                    type: 'BOOK',
                });
                mockQuota.assertPageCredits.mockRejectedValueOnce(
                    new ForbiddenException('quota exceeded'),
                );

                await expect(service.enqueue('s1', 'u1')).rejects.toThrow(ForbiddenException);
                expect(mockPrisma.job.create).not.toHaveBeenCalled();
                expect(mockQueue.add).not.toHaveBeenCalled();
            });
        });

        describe('given story not found', () => {
            it('should throw NotFoundException', async () => {
                mockPrisma.story.findFirst.mockResolvedValue(null);
                await expect(service.enqueue('missing', 'u1')).rejects.toThrow(NotFoundException);
            });
        });

        describe('given story is not DRAFT', () => {
            it('should throw ConflictException', async () => {
                mockPrisma.story.findFirst.mockResolvedValue({
                    id: 's1',
                    status: 'QUEUED',
                    userId: 'u1',
                });
                await expect(service.enqueue('s1', 'u1')).rejects.toThrow(ConflictException);
            });
        });

        describe('given an active job already exists for this user', () => {
            it('should throw ConflictException with 409 status', async () => {
                mockPrisma.story.findFirst.mockResolvedValue({
                    id: 's1',
                    status: 'DRAFT',
                    userId: 'u1',
                });
                mockPrisma.job.findFirst.mockResolvedValue({
                    id: 'existing-job',
                    status: 'ACTIVE',
                });

                await expect(service.enqueue('s1', 'u1')).rejects.toThrow(ConflictException);
                expect(mockQueue.add).not.toHaveBeenCalled();
            });
        });
    });
});

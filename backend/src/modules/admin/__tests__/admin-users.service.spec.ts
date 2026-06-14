import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AdminUsersService } from '../admin-users.service.js';

const ADMIN_ID = 'admin-1';
const TARGET_ID = 'user-2';

function buildUserRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        id: TARGET_ID,
        email: 'user@b.com',
        name: 'User Two',
        avatarUrl: null,
        role: 'USER',
        suspendedAt: null,
        createdAt: new Date('2026-01-01'),
        subscription: { pricingTier: { name: 'Free Chapter' } },
        _count: { stories: 3 },
        ...overrides,
    };
}

function buildPrismaMock() {
    return {
        user: {
            findMany: vi.fn().mockResolvedValue([buildUserRow()]),
            count: vi.fn().mockResolvedValue(1),
            findUnique: vi.fn().mockResolvedValue({ id: TARGET_ID }),
            update: vi
                .fn()
                .mockImplementation(({ data }: { data: unknown }) =>
                    Promise.resolve({ id: TARGET_ID, ...(data as object) }),
                ),
        },
        $transaction: vi.fn().mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
}

describe('AdminUsersService', () => {
    let service: AdminUsersService;
    let prisma: ReturnType<typeof buildPrismaMock>;

    beforeEach(async () => {
        prisma = buildPrismaMock();
        const module = await Test.createTestingModule({
            providers: [AdminUsersService, { provide: PrismaService, useValue: prisma }],
        }).compile();
        service = module.get(AdminUsersService);
    });

    describe('list', () => {
        it('should map rows to summaries with tier name and story count', async () => {
            const result = await service.list(undefined, 1, 20);

            expect(result.items[0]).toMatchObject({
                id: TARGET_ID,
                subscriptionTier: 'Free Chapter',
                storiesCount: 3,
            });
            expect(result.total).toBe(1);
        });

        it('should expose a null tier when the user has no subscription', async () => {
            prisma.user.findMany.mockResolvedValue([buildUserRow({ subscription: null })]);

            const result = await service.list(undefined, 1, 20);

            expect(result.items[0].subscriptionTier).toBeNull();
        });

        it('should apply pagination via skip/take', async () => {
            await service.list(undefined, 3, 10);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ skip: 20, take: 10 }),
            );
        });

        it('should filter by name/email when a search term is given', async () => {
            await service.list('ann', 1, 20);

            expect(prisma.user.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        OR: [
                            { email: { contains: 'ann', mode: 'insensitive' } },
                            { name: { contains: 'ann', mode: 'insensitive' } },
                        ],
                    },
                }),
            );
        });
    });

    describe('changeRole', () => {
        it('should reject changing your own role', async () => {
            await expect(service.changeRole(ADMIN_ID, ADMIN_ID, 'ADMIN')).rejects.toThrow(
                BadRequestException,
            );
            expect(prisma.user.update).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when the target is missing', async () => {
            prisma.user.findUnique.mockResolvedValue(null);

            await expect(service.changeRole(ADMIN_ID, TARGET_ID, 'ADMIN')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should update the target role', async () => {
            await service.changeRole(ADMIN_ID, TARGET_ID, 'ADMIN');

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: TARGET_ID },
                data: { role: 'ADMIN' },
            });
        });
    });

    describe('setSuspension', () => {
        it('should reject suspending your own account', async () => {
            await expect(service.setSuspension(ADMIN_ID, ADMIN_ID, true)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should set suspendedAt to a date when suspending', async () => {
            await service.setSuspension(ADMIN_ID, TARGET_ID, true);

            const call = prisma.user.update.mock.calls[0][0] as { data: { suspendedAt: Date } };
            expect(call.data.suspendedAt).toBeInstanceOf(Date);
        });

        it('should clear suspendedAt when reinstating', async () => {
            await service.setSuspension(ADMIN_ID, TARGET_ID, false);

            expect(prisma.user.update).toHaveBeenCalledWith({
                where: { id: TARGET_ID },
                data: { suspendedAt: null },
            });
        });
    });
});

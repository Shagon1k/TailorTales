import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Child } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { ChildrenService } from '../children.service.js';
import type { CreateChildDto } from '../dto/create-child.dto.js';
import type { UpdateChildDto } from '../dto/update-child.dto.js';

const MOCK_CHILD: Child = {
    id: 'child-1',
    userId: 'user-123',
    name: 'Max',
    birthdate: new Date('2020-06-15'),
    gender: 'MALE',
    interests: ['dinosaurs', 'space'],
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('ChildrenService', () => {
    let service: ChildrenService;
    let childFindMany: ReturnType<typeof vi.fn>;
    let childFindFirst: ReturnType<typeof vi.fn>;
    let childCreate: ReturnType<typeof vi.fn>;
    let childUpdate: ReturnType<typeof vi.fn>;
    let childDelete: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        childFindMany = vi.fn();
        childFindFirst = vi.fn();
        childCreate = vi.fn();
        childUpdate = vi.fn();
        childDelete = vi.fn();

        const module = await Test.createTestingModule({
            providers: [
                ChildrenService,
                {
                    provide: PrismaService,
                    useValue: {
                        child: {
                            findMany: childFindMany,
                            findFirst: childFindFirst,
                            create: childCreate,
                            update: childUpdate,
                            delete: childDelete,
                        },
                    },
                },
            ],
        }).compile();

        service = module.get(ChildrenService);
    });

    describe('findAllByUser', () => {
        it('should return all children belonging to the user', async () => {
            childFindMany.mockResolvedValue([MOCK_CHILD]);

            const result = await service.findAllByUser('user-123');

            expect(childFindMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { createdAt: 'asc' },
            });
            expect(result).toEqual([MOCK_CHILD]);
        });

        it('should return an empty array when the user has no children', async () => {
            childFindMany.mockResolvedValue([]);

            const result = await service.findAllByUser('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return the child when id and userId match', async () => {
            childFindFirst.mockResolvedValue(MOCK_CHILD);

            const result = await service.findOne('child-1', 'user-123');

            expect(childFindFirst).toHaveBeenCalledWith({
                where: { id: 'child-1', userId: 'user-123' },
            });
            expect(result).toBe(MOCK_CHILD);
        });

        it('should throw NotFoundException when child does not exist', async () => {
            childFindFirst.mockResolvedValue(null);

            await expect(service.findOne('unknown', 'user-123')).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when child belongs to a different user', async () => {
            childFindFirst.mockResolvedValue(null);

            await expect(service.findOne('child-1', 'other-user')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        it('should create and return a new child', async () => {
            childCreate.mockResolvedValue(MOCK_CHILD);
            const dto: CreateChildDto = {
                name: 'Max',
                birthdate: '2020-06-15',
                gender: 'MALE',
                interests: ['dinosaurs', 'space'],
            };

            const result = await service.create('user-123', dto);

            expect(childCreate).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    name: 'Max',
                    birthdate: new Date('2020-06-15'),
                    gender: 'MALE',
                    interests: ['dinosaurs', 'space'],
                    avatarUrl: undefined,
                },
            });
            expect(result).toBe(MOCK_CHILD);
        });

        it('should default interests to an empty array when not provided', async () => {
            childCreate.mockResolvedValue(MOCK_CHILD);
            const dto: CreateChildDto = { name: 'Max', birthdate: '2020-06-15', gender: 'MALE' };

            await service.create('user-123', dto);

            expect(childCreate).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ interests: [] }) }),
            );
        });
    });

    describe('update', () => {
        it('should update and return the child', async () => {
            const updated = { ...MOCK_CHILD, name: 'Maxim' };
            childFindFirst.mockResolvedValue(MOCK_CHILD);
            childUpdate.mockResolvedValue(updated);
            const dto: UpdateChildDto = { name: 'Maxim' };

            const result = await service.update('child-1', 'user-123', dto);

            expect(childUpdate).toHaveBeenCalledWith({
                where: { id: 'child-1' },
                data: { name: 'Maxim' },
            });
            expect(result).toEqual(updated);
        });

        it('should throw NotFoundException when child belongs to a different user', async () => {
            childFindFirst.mockResolvedValue(null);

            await expect(service.update('child-1', 'other-user', { name: 'X' })).rejects.toThrow(
                NotFoundException,
            );
            expect(childUpdate).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should delete the child', async () => {
            childFindFirst.mockResolvedValue(MOCK_CHILD);
            childDelete.mockResolvedValue(MOCK_CHILD);

            await service.remove('child-1', 'user-123');

            expect(childDelete).toHaveBeenCalledWith({ where: { id: 'child-1' } });
        });

        it('should throw NotFoundException when child belongs to a different user', async () => {
            childFindFirst.mockResolvedValue(null);

            await expect(service.remove('child-1', 'other-user')).rejects.toThrow(
                NotFoundException,
            );
            expect(childDelete).not.toHaveBeenCalled();
        });
    });
});

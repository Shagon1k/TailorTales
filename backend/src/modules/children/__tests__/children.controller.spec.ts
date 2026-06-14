import { Test } from '@nestjs/testing';
import type { Child, User } from '../../../generated/prisma/client.js';
import { ChildrenController } from '../children.controller.js';
import { ChildrenService } from '../children.service.js';

const MOCK_USER: User = {
    id: 'user-123',
    googleId: 'google-abc',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    notificationPreferences: null,
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
};

const MOCK_CHILD: Child = {
    id: 'child-1',
    userId: 'user-123',
    name: 'Max',
    birthdate: new Date('2020-06-15'),
    gender: 'MALE',
    interests: ['dinosaurs'],
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('ChildrenController', () => {
    let controller: ChildrenController;
    let findAllByUser: ReturnType<typeof vi.fn>;
    let findOne: ReturnType<typeof vi.fn>;
    let create: ReturnType<typeof vi.fn>;
    let update: ReturnType<typeof vi.fn>;
    let remove: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        findAllByUser = vi.fn();
        findOne = vi.fn();
        create = vi.fn();
        update = vi.fn();
        remove = vi.fn();

        const module = await Test.createTestingModule({
            controllers: [ChildrenController],
            providers: [
                {
                    provide: ChildrenService,
                    useValue: { findAllByUser, findOne, create, update, remove },
                },
            ],
        }).compile();

        controller = module.get(ChildrenController);
    });

    describe('findAll', () => {
        it('should return children for the current user', async () => {
            findAllByUser.mockResolvedValue([MOCK_CHILD]);

            const result = await controller.findAll(MOCK_USER);

            expect(findAllByUser).toHaveBeenCalledWith('user-123');
            expect(result).toEqual([MOCK_CHILD]);
        });
    });

    describe('findOne', () => {
        it('should return a single child by id', async () => {
            findOne.mockResolvedValue(MOCK_CHILD);

            const result = await controller.findOne('child-1', MOCK_USER);

            expect(findOne).toHaveBeenCalledWith('child-1', 'user-123');
            expect(result).toBe(MOCK_CHILD);
        });
    });

    describe('create', () => {
        it('should create a child and return it', async () => {
            create.mockResolvedValue(MOCK_CHILD);
            const dto = { name: 'Max', birthdate: '2020-06-15', gender: 'MALE' as const };

            const result = await controller.create(MOCK_USER, dto);

            expect(create).toHaveBeenCalledWith('user-123', dto);
            expect(result).toBe(MOCK_CHILD);
        });
    });

    describe('update', () => {
        it('should update a child and return it', async () => {
            const updated = { ...MOCK_CHILD, name: 'Maxim' };
            update.mockResolvedValue(updated);

            const result = await controller.update('child-1', MOCK_USER, { name: 'Maxim' });

            expect(update).toHaveBeenCalledWith('child-1', 'user-123', { name: 'Maxim' });
            expect(result).toEqual(updated);
        });
    });

    describe('remove', () => {
        it('should call service.remove with the correct arguments', async () => {
            remove.mockResolvedValue(undefined);

            await controller.remove('child-1', MOCK_USER);

            expect(remove).toHaveBeenCalledWith('child-1', 'user-123');
        });
    });
});

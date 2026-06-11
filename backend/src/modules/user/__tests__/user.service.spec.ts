import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { UserService } from '../user.service.js';

const MOCK_USER: User = {
    id: 'user-123',
    googleId: 'google-abc',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
    regenerationsInWindow: 0,
    regenerationWindowStartedAt: null,
};

describe('UserService', () => {
    let service: UserService;
    let userFindUnique: ReturnType<typeof vi.fn>;
    let userCreate: ReturnType<typeof vi.fn>;
    let userUpdate: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        userFindUnique = vi.fn();
        userCreate = vi.fn();
        userUpdate = vi.fn();

        const module = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: userFindUnique,
                            create: userCreate,
                            update: userUpdate,
                        },
                    },
                },
            ],
        }).compile();

        service = module.get(UserService);
    });

    describe('findById', () => {
        it('should return the user when found', async () => {
            userFindUnique.mockResolvedValue(MOCK_USER);

            const result = await service.findById('user-123');

            expect(userFindUnique).toHaveBeenCalledWith({ where: { id: 'user-123' } });
            expect(result).toBe(MOCK_USER);
        });

        it('should return null when the user does not exist', async () => {
            userFindUnique.mockResolvedValue(null);

            const result = await service.findById('unknown');

            expect(result).toBeNull();
        });
    });

    describe('findOrCreate', () => {
        it('should return the existing user when the googleId already exists', async () => {
            userFindUnique.mockResolvedValue(MOCK_USER);

            const result = await service.findOrCreate({
                googleId: 'google-abc',
                email: 'alice@example.com',
                name: 'Alice',
            });

            expect(userCreate).not.toHaveBeenCalled();
            expect(result).toBe(MOCK_USER);
        });

        it('should create and return a new user when the googleId does not exist', async () => {
            userFindUnique.mockResolvedValue(null);
            userCreate.mockResolvedValue(MOCK_USER);

            const params = { googleId: 'google-abc', email: 'alice@example.com', name: 'Alice' };
            const result = await service.findOrCreate(params);

            expect(userCreate).toHaveBeenCalledWith({
                data: {
                    googleId: 'google-abc',
                    email: 'alice@example.com',
                    name: 'Alice',
                    avatarUrl: undefined,
                },
            });
            expect(result).toBe(MOCK_USER);
        });
    });

    describe('updateName', () => {
        it('should update and return the user with the new name', async () => {
            const updated = { ...MOCK_USER, name: 'Bob' };
            userUpdate.mockResolvedValue(updated);

            const result = await service.updateName('user-123', 'Bob');

            expect(userUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { name: 'Bob' },
            });
            expect(result).toEqual(updated);
        });
    });
});

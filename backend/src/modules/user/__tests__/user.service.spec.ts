import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { UserService } from '../user.service.js';
import type { IUploadedAvatarFile } from '../user.types.js';

const MOCK_USER: User = {
    id: 'user-123',
    googleId: 'google-abc',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    avatarKey: null,
    notificationPreferences: null,
    role: 'USER',
    suspendedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const MOCK_FREE_TIER = { id: 'tier-free', name: 'Free Chapter', priceMonthly: 0 };

describe('UserService', () => {
    let service: UserService;
    let userFindUnique: ReturnType<typeof vi.fn>;
    let userCreate: ReturnType<typeof vi.fn>;
    let userUpdate: ReturnType<typeof vi.fn>;
    let pricingTierFindFirst: ReturnType<typeof vi.fn>;
    let upload: ReturnType<typeof vi.fn>;
    let getSignedUrl: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        userFindUnique = vi.fn();
        userCreate = vi.fn();
        userUpdate = vi.fn();
        pricingTierFindFirst = vi.fn().mockResolvedValue(MOCK_FREE_TIER);
        upload = vi.fn().mockResolvedValue('users/user-123/profile/avatar');
        getSignedUrl = vi
            .fn()
            .mockResolvedValue('https://signed.test/users/user-123/profile/avatar');

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
                        pricingTier: {
                            findFirst: pricingTierFindFirst,
                        },
                    },
                },
                { provide: StorageService, useValue: { upload, getSignedUrl } },
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
            userUpdate.mockResolvedValue(MOCK_USER);

            const result = await service.findOrCreate({
                googleId: 'google-abc',
                email: 'alice@example.com',
                name: 'Alice',
            });

            expect(userUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: {
                    email: 'alice@example.com',
                    name: 'Alice',
                    avatarUrl: undefined,
                },
            });
            expect(userCreate).not.toHaveBeenCalled();
            expect(result).toEqual({ user: MOCK_USER, isNew: false });
        });

        it('should create a new user with a free-tier subscription when the googleId does not exist', async () => {
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
                    subscription: {
                        create: {
                            pricingTierId: MOCK_FREE_TIER.id,
                            currentPeriodEnd: expect.any(Date),
                        },
                    },
                },
            });
            expect(result).toEqual({ user: MOCK_USER, isNew: true });
        });

        it('should create the user without a subscription when no free tier is seeded', async () => {
            userFindUnique.mockResolvedValue(null);
            userCreate.mockResolvedValue(MOCK_USER);
            pricingTierFindFirst.mockResolvedValue(null);

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
            expect(result).toEqual({ user: MOCK_USER, isNew: true });
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

    describe('uploadAvatar', () => {
        it('should upload the avatar, persist the key, and return a signed URL', async () => {
            const updated = { ...MOCK_USER, avatarKey: 'users/user-123/profile/avatar' };
            userUpdate.mockResolvedValue(updated);

            const result = await service.uploadAvatar('user-123', {
                buffer: Buffer.from('image'),
                mimetype: 'image/png',
                size: 1024,
            } satisfies IUploadedAvatarFile);

            expect(upload).toHaveBeenCalledWith(
                Buffer.from('image'),
                'users/user-123/profile/avatar',
                'image/png',
            );
            expect(userUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: { avatarKey: 'users/user-123/profile/avatar' },
            });
            expect(result.avatarUrl).toBe('https://signed.test/users/user-123/profile/avatar');
        });
    });
});

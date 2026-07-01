import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { AccountDeletionService } from '../account-deletion.service.js';
import { DataExportService } from '../data-export.service.js';
import { UserController } from '../user.controller.js';
import { UserService } from '../user.service.js';
import type { ICurrentUserResponse } from '../user.types.js';

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

const PRESENTED_USER: ICurrentUserResponse = {
    id: 'user-123',
    email: 'alice@example.com',
    name: 'Alice',
    avatarUrl: null,
    hasCustomAvatar: false,
    role: 'USER',
    createdAt: MOCK_USER.createdAt,
    updatedAt: MOCK_USER.updatedAt,
};

describe('UserController', () => {
    let controller: UserController;
    let updateName: ReturnType<typeof vi.fn>;
    let presentUser: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        updateName = vi.fn();
        presentUser = vi.fn().mockResolvedValue(PRESENTED_USER);

        const module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: UserService, useValue: { updateName, presentUser } },
                { provide: DataExportService, useValue: { exportUserData: vi.fn() } },
                { provide: AccountDeletionService, useValue: { deleteAccount: vi.fn() } },
            ],
        }).compile();

        controller = module.get(UserController);
    });

    describe('getMe', () => {
        it('should return the presented current user', async () => {
            await expect(controller.getMe(MOCK_USER)).resolves.toBe(PRESENTED_USER);
            expect(presentUser).toHaveBeenCalledWith(MOCK_USER);
        });
    });

    describe('updateMe', () => {
        it('should call userService.updateName and return the presented user', async () => {
            const updated = { ...MOCK_USER, name: 'Bob' };
            updateName.mockResolvedValue(updated);

            const result = await controller.updateMe(MOCK_USER, { name: 'Bob' });

            expect(updateName).toHaveBeenCalledWith('user-123', 'Bob');
            expect(presentUser).toHaveBeenCalledWith(updated);
            expect(result).toEqual(PRESENTED_USER);
        });
    });
});

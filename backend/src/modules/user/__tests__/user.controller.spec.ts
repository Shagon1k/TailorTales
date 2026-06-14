import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { AccountDeletionService } from '../account-deletion.service.js';
import { DataExportService } from '../data-export.service.js';
import { UserController } from '../user.controller.js';
import { UserService } from '../user.service.js';

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

describe('UserController', () => {
    let controller: UserController;
    let updateName: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        updateName = vi.fn();

        const module = await Test.createTestingModule({
            controllers: [UserController],
            providers: [
                { provide: UserService, useValue: { updateName } },
                { provide: DataExportService, useValue: { exportUserData: vi.fn() } },
                { provide: AccountDeletionService, useValue: { deleteAccount: vi.fn() } },
            ],
        }).compile();

        controller = module.get(UserController);
    });

    describe('getMe', () => {
        it('should return the current user', () => {
            expect(controller.getMe(MOCK_USER)).toBe(MOCK_USER);
        });
    });

    describe('updateMe', () => {
        it('should call userService.updateName and return the updated user', async () => {
            const updated = { ...MOCK_USER, name: 'Bob' };
            updateName.mockResolvedValue(updated);

            const result = await controller.updateMe(MOCK_USER, { name: 'Bob' });

            expect(updateName).toHaveBeenCalledWith('user-123', 'Bob');
            expect(result).toEqual(updated);
        });
    });
});

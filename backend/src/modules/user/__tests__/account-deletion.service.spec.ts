import { BadGatewayException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { PADDLE_CLIENT } from '../../billing/billing.types.js';
import { StorageService } from '../../storage/storage.service.js';
import { AccountDeletionService } from '../account-deletion.service.js';

const USER_ID = 'user-1';

describe('AccountDeletionService', () => {
    let service: AccountDeletionService;
    let subscriptionFindUnique: ReturnType<typeof vi.fn>;
    let userDelete: ReturnType<typeof vi.fn>;
    let storyFindMany: ReturnType<typeof vi.fn>;
    let pageFindMany: ReturnType<typeof vi.fn>;
    let characterFindMany: ReturnType<typeof vi.fn>;
    let listKeys: ReturnType<typeof vi.fn>;
    let deleteMany: ReturnType<typeof vi.fn>;
    let cancelSubscription: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        subscriptionFindUnique = vi.fn().mockResolvedValue(null);
        userDelete = vi.fn().mockResolvedValue({});
        storyFindMany = vi.fn().mockResolvedValue([
            {
                pdfKey: 'users/user-1/stories/s1/story.pdf',
                coverImageKey: 'users/user-1/stories/s1/cover',
            },
        ]);
        pageFindMany = vi
            .fn()
            .mockResolvedValue([{ illustrations: [{ key: 'users/user-1/stories/s1/pages/1' }] }]);
        characterFindMany = vi.fn().mockResolvedValue([{ previewKey: null }]);
        listKeys = vi
            .fn()
            .mockResolvedValue([
                'users/user-1/stories/s1/story.pdf',
                'users/user-1/stories/s1/cover',
                'users/user-1/stories/s1/pages/1',
            ]);
        deleteMany = vi.fn().mockResolvedValue({ requested: 3, deleted: 3 });
        cancelSubscription = vi.fn().mockResolvedValue(undefined);

        const module = await Test.createTestingModule({
            providers: [
                AccountDeletionService,
                {
                    provide: PrismaService,
                    useValue: {
                        subscription: { findUnique: subscriptionFindUnique },
                        user: { delete: userDelete },
                        story: { findMany: storyFindMany },
                        page: { findMany: pageFindMany },
                        character: { findMany: characterFindMany },
                    },
                },
                { provide: StorageService, useValue: { listKeys, deleteMany } },
                { provide: PADDLE_CLIENT, useValue: { cancelSubscription } },
            ],
        }).compile();

        service = module.get(AccountDeletionService);
    });

    it('should delete S3 objects by prefix listing, then the user row', async () => {
        await service.deleteAccount(USER_ID);

        expect(listKeys).toHaveBeenCalledWith('users/user-1/');
        expect(deleteMany).toHaveBeenCalledWith([
            'users/user-1/stories/s1/story.pdf',
            'users/user-1/stories/s1/cover',
            'users/user-1/stories/s1/pages/1',
        ]);
        expect(userDelete).toHaveBeenCalledWith({ where: { id: USER_ID } });
    });

    it('should skip the Paddle call for free-tier users', async () => {
        subscriptionFindUnique.mockResolvedValue({ paddleSubscriptionId: null });

        await service.deleteAccount(USER_ID);

        expect(cancelSubscription).not.toHaveBeenCalled();
        expect(userDelete).toHaveBeenCalled();
    });

    it('should cancel a live Paddle subscription before deleting anything', async () => {
        subscriptionFindUnique.mockResolvedValue({ paddleSubscriptionId: 'sub_1' });

        await service.deleteAccount(USER_ID);

        expect(cancelSubscription).toHaveBeenCalledWith('sub_1');
        expect(cancelSubscription.mock.invocationCallOrder[0]).toBeLessThan(
            deleteMany.mock.invocationCallOrder[0],
        );
        expect(deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
            userDelete.mock.invocationCallOrder[0],
        );
    });

    it('should abort with 502 when the Paddle cancel fails — nothing is deleted', async () => {
        subscriptionFindUnique.mockResolvedValue({ paddleSubscriptionId: 'sub_1' });
        cancelSubscription.mockRejectedValue(new Error('Paddle 500'));

        await expect(service.deleteAccount(USER_ID)).rejects.toThrow(BadGatewayException);

        expect(deleteMany).not.toHaveBeenCalled();
        expect(userDelete).not.toHaveBeenCalled();
    });

    it('should still delete the user when some S3 deletes fail (audit is logged)', async () => {
        deleteMany.mockResolvedValue({ requested: 3, deleted: 2 });

        await service.deleteAccount(USER_ID);

        expect(userDelete).toHaveBeenCalled();
    });
});

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { User } from '../../generated/prisma/client.js';
import { UserService } from '../../user/user.service.js';
import { JwtStrategy } from '../strategies/jwt.strategy.js';

describe('JwtStrategy', () => {
    let strategy: JwtStrategy;
    let findById: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        findById = vi.fn();

        const module = await Test.createTestingModule({
            providers: [
                JwtStrategy,
                { provide: UserService, useValue: { findById } },
                {
                    provide: ConfigService,
                    useValue: { getOrThrow: vi.fn().mockReturnValue('test-secret') },
                },
            ],
        }).compile();

        strategy = module.get(JwtStrategy);
    });

    describe('validate', () => {
        it('should return the user when the id exists', async () => {
            const user = { id: 'user-123', email: 'a@b.com' } as User;
            findById.mockResolvedValue(user);

            const result = await strategy.validate({ sub: 'user-123' });

            expect(findById).toHaveBeenCalledWith('user-123');
            expect(result).toBe(user);
        });

        it('should throw UnauthorizedException when the user is not found', async () => {
            findById.mockResolvedValue(null);

            await expect(strategy.validate({ sub: 'ghost-id' })).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});

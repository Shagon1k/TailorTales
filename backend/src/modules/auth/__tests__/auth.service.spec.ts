import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { User } from '../../../generated/prisma/client.js';
import { AuthService } from '../auth.service.js';

describe('AuthService', () => {
    let service: AuthService;
    let jwtSign: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        jwtSign = vi.fn().mockReturnValue('signed.token');

        const module = await Test.createTestingModule({
            providers: [AuthService, { provide: JwtService, useValue: { sign: jwtSign } }],
        }).compile();

        service = module.get(AuthService);
    });

    describe('issueToken', () => {
        it('should sign a JWT with the user id as sub', () => {
            const user = { id: 'user-123' } as User;

            const token = service.issueToken(user);

            expect(jwtSign).toHaveBeenCalledWith({ sub: 'user-123' });
            expect(token).toBe('signed.token');
        });
    });
});

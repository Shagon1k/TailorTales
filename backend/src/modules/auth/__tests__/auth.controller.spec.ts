import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { User } from '../../../generated/prisma/client.js';
import { AuthController } from '../auth.controller.js';
import { AuthService } from '../auth.service.js';

describe('AuthController', () => {
    let controller: AuthController;
    let issueToken: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        issueToken = vi.fn().mockReturnValue('test.token');

        const module = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthService, useValue: { issueToken } },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: vi.fn((key: string) => {
                            if (key === 'FRONTEND_URL') return 'http://localhost:3000';
                            if (key === 'JWT_EXPIRY_DAYS') return 7;
                            return undefined;
                        }),
                    },
                },
            ],
        }).compile();

        controller = module.get(AuthController);
    });

    describe('logout', () => {
        it('should clear the auth cookie and return 200', () => {
            const res = { clearCookie: vi.fn(), sendStatus: vi.fn() } as unknown as Response;

            controller.logout(res);

            expect(res.clearCookie).toHaveBeenCalledWith('access_token');
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });
    });

    describe('googleCallback', () => {
        it('should issue a token, set an httpOnly cookie, and redirect to the frontend', () => {
            const user = { id: 'user-123' } as User;
            const req = { user } as unknown as Request;
            const res = { cookie: vi.fn(), redirect: vi.fn() } as unknown as Response;

            controller.googleCallback(req, res);

            expect(issueToken).toHaveBeenCalledWith(user);
            expect(res.cookie).toHaveBeenCalledWith(
                'access_token',
                'test.token',
                expect.objectContaining({ httpOnly: true }),
            );
            expect(res.redirect).toHaveBeenCalledWith('http://localhost:3000');
        });
    });
});

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Profile, VerifyCallback } from 'passport-google-oauth20';
import type { User } from '../../../generated/prisma/client.js';
import { UserService } from '../../user/user.service.js';
import { AuthEmailAllowlistService } from '../auth-email-allowlist.service.js';
import { GoogleStrategy } from '../strategies/google.strategy.js';

const GOOGLE_PROFILE: Profile = {
    provider: 'google',
    id: 'google-123',
    displayName: 'Allowed User',
    profileUrl: 'https://example.com/profile',
    emails: [{ value: 'Allowed@Example.com', verified: true }],
    photos: [{ value: 'https://example.com/avatar.png' }],
    _raw: '',
    _json: {
        iss: 'https://accounts.google.com',
        aud: 'client-id',
        sub: 'google-123',
        iat: 1,
        exp: 2,
        email: 'Allowed@Example.com',
        email_verified: true,
    },
};

const USER: User = {
    id: 'user-123',
    email: 'Allowed@Example.com',
    googleId: 'google-123',
    name: 'Allowed User',
    avatarUrl: 'https://example.com/avatar.png',
    avatarKey: null,
    role: 'USER',
    suspendedAt: null,
    notificationPreferences: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

describe('GoogleStrategy', () => {
    let strategy: GoogleStrategy;
    let findOrCreate: ReturnType<typeof vi.fn>;
    let assertAllowed: ReturnType<typeof vi.fn>;
    let done: VerifyCallback;

    beforeEach(async () => {
        findOrCreate = vi.fn().mockResolvedValue(USER);
        assertAllowed = vi.fn();
        done = vi.fn<VerifyCallback>();

        const configValues: Record<string, string> = {
            GOOGLE_CLIENT_ID: 'client-id',
            GOOGLE_CLIENT_SECRET: 'client-secret',
            BACKEND_URL: 'http://localhost:3001',
        };

        const module = await Test.createTestingModule({
            providers: [
                GoogleStrategy,
                { provide: UserService, useValue: { findOrCreate } },
                {
                    provide: AuthEmailAllowlistService,
                    useValue: { assertAllowed },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        getOrThrow: vi.fn((key: string): string => configValues[key] ?? ''),
                    },
                },
            ],
        }).compile();

        strategy = module.get(GoogleStrategy);
    });

    describe('validate', () => {
        it('should enforce the allowlist before finding or creating the user', async () => {
            await strategy.validate('', '', GOOGLE_PROFILE, done);

            expect(assertAllowed).toHaveBeenCalledWith('Allowed@Example.com');
            expect(findOrCreate).toHaveBeenCalledWith({
                googleId: 'google-123',
                email: 'Allowed@Example.com',
                name: 'Allowed User',
                avatarUrl: 'https://example.com/avatar.png',
            });
            expect(done).toHaveBeenCalledWith(null, USER);
        });

        it('should not find or create the user when the email is rejected', async () => {
            assertAllowed.mockImplementation(() => {
                throw new UnauthorizedException('errors.auth.emailNotAllowed');
            });

            await expect(strategy.validate('', '', GOOGLE_PROFILE, done)).rejects.toThrow(
                UnauthorizedException,
            );
            expect(findOrCreate).not.toHaveBeenCalled();
            expect(done).not.toHaveBeenCalled();
        });
    });
});

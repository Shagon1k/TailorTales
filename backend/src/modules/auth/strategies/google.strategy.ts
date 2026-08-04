import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UserService } from '../../user/user.service.js';
import { AuthEmailAllowlistService } from '../auth-email-allowlist.service.js';
import type { IAuthenticatedGoogleUser } from '../auth.types.js';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        configService: ConfigService,
        private readonly userService: UserService,
        private readonly emailAllowlist: AuthEmailAllowlistService,
    ) {
        super({
            clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: `${configService.getOrThrow<string>('BACKEND_URL')}/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, emails, displayName, photos } = profile;
        const email = emails?.[0]?.value ?? '';

        this.emailAllowlist.assertAllowed(email);

        const authUser: IAuthenticatedGoogleUser = await this.userService.findOrCreate({
            googleId: id,
            email,
            name: displayName,
            avatarUrl: photos?.[0]?.value,
        });

        done(null, authUser);
    }
}

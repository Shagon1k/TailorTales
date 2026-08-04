import {
    Controller,
    Get,
    Headers,
    NotFoundException,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { Public } from './decorators/public.decorator.js';
import { UserService } from '../user/user.service.js';
import type { IAuthenticatedGoogleUser } from './auth.types.js';

const COOKIE_NAME = 'access_token';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const E2E_USER = {
    email: 'e2e-smoke@tailortales.invalid',
    googleId: 'e2e:smoke',
    name: 'UAT Smoke Test',
};

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly userService: UserService,
    ) {}

    @Public()
    @Throttle({ default: { ttl: 60000, limit: 10 } })
    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin(): void {
        // Passport redirects to Google — no body needed
    }

    @Public()
    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleCallback(
        @Req() req: Request & { user: IAuthenticatedGoogleUser },
        @Res() res: Response,
    ): void {
        const { user, isNew } = req.user;
        const token = this.authService.issueToken(user);
        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

        const expiryDays = this.configService.getOrThrow<number>('JWT_EXPIRY_DAYS');

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: expiryDays * MS_PER_DAY,
            secure: process.env.NODE_ENV === 'production',
        });

        res.redirect(`${frontendUrl}/library${isNew ? '?signup=completed' : ''}`);
    }

    @Public()
    @Post('e2e/session')
    async createE2eSession(
        @Headers('x-e2e-test-secret') providedSecret: string | undefined,
        @Res() res: Response,
    ): Promise<void> {
        const expectedSecret = this.configService.get<string>('E2E_TEST_SECRET');

        if (!expectedSecret) throw new NotFoundException();
        if (providedSecret !== expectedSecret) throw new UnauthorizedException();

        const { user } = await this.userService.findOrCreate(E2E_USER);
        const token = this.authService.issueToken(user);
        const expiryDays = this.configService.getOrThrow<number>('JWT_EXPIRY_DAYS');

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: expiryDays * MS_PER_DAY,
            secure: process.env.NODE_ENV === 'production',
        });
        res.sendStatus(204);
    }

    @Post('logout')
    logout(@Res() res: Response): void {
        res.clearCookie(COOKIE_NAME);
        res.sendStatus(200);
    }
}

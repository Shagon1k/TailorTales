import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { type User } from '../generated/prisma/client.js';
import { AuthService } from './auth.service.js';

const COOKIE_NAME = 'access_token';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {}

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin(): void {
        // Passport redirects to Google — no body needed
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    googleCallback(@Req() req: Request, @Res() res: Response): void {
        const user = req.user as User;
        const token = this.authService.issueToken(user);
        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

        const expiryDays = this.configService.getOrThrow<number>('JWT_EXPIRY_DAYS');

        res.cookie(COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: expiryDays * MS_PER_DAY,
            secure: process.env.NODE_ENV === 'production',
        });

        res.redirect(frontendUrl);
    }

    @Post('logout')
    logout(@Res() res: Response): void {
        res.clearCookie(COOKIE_NAME);
        res.sendStatus(200);
    }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { type User } from '../../../generated/prisma/client.js';
import { UserService } from '../../user/user.service.js';

interface IJwtPayload {
    sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private readonly userService: UserService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => req.cookies?.access_token as string | null,
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    async validate(payload: IJwtPayload): Promise<User> {
        const user = await this.userService.findById(payload.sub);

        if (!user) {
            throw new UnauthorizedException();
        }

        // Suspended accounts are rejected on every request — effectively logged out everywhere.
        if (user.suspendedAt) {
            throw new UnauthorizedException('Account suspended');
        }

        return user;
    }
}

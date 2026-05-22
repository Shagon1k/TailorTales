import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type User } from '../generated/prisma/client.js';

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) {}

    issueToken(user: User): string {
        return this.jwtService.sign({ sub: user.id });
    }
}

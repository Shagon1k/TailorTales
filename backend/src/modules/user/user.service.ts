import { Injectable } from '@nestjs/common';
import { type User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

interface IFindOrCreateUserParams {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findOrCreate(params: IFindOrCreateUserParams): Promise<User> {
        const { googleId, email, name, avatarUrl } = params;

        const existing = await this.prisma.user.findUnique({ where: { googleId } });

        if (existing) {
            return existing;
        }

        return this.prisma.user.create({
            data: { googleId, email, name, avatarUrl },
        });
    }

    async updateName(id: string, name: string): Promise<User> {
        return this.prisma.user.update({ where: { id }, data: { name } });
    }
}

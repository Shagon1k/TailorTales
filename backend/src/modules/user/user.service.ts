import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { type User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageKeys } from '../storage/storage.keys.js';
import { StorageService } from '../storage/storage.service.js';
import {
    USER_AVATAR_ALLOWED_MIME_TYPES,
    USER_AVATAR_MAX_BYTES,
    type TUserAvatarMimeType,
} from './user.constants.js';
import type { ICurrentUserResponse, IUploadedAvatarFile } from './user.types.js';

function nextMonth(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
}

interface IFindOrCreateUserParams {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: StorageService,
    ) {}

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findOrCreate(params: IFindOrCreateUserParams): Promise<User> {
        const { googleId, email, name, avatarUrl } = params;

        const existing = await this.prisma.user.findUnique({ where: { googleId } });

        if (existing) {
            return this.prisma.user.update({
                where: { id: existing.id },
                data: { email, name, avatarUrl },
            });
        }

        // Every user owns a Subscription row from day one (free tier by default)
        const freeTier = await this.prisma.pricingTier.findFirst({
            where: { priceMonthly: 0 },
        });

        if (!freeTier) {
            this.logger.warn(
                'No free PricingTier found (run seed:pricing-tiers) — user created without subscription',
            );
        }

        return this.prisma.user.create({
            data: {
                googleId,
                email,
                name,
                avatarUrl,
                ...(freeTier && {
                    subscription: {
                        create: { pricingTierId: freeTier.id, currentPeriodEnd: nextMonth() },
                    },
                }),
            },
        });
    }

    async updateName(id: string, name: string): Promise<User> {
        return this.prisma.user.update({ where: { id }, data: { name } });
    }

    async uploadAvatar(
        userId: string,
        file: IUploadedAvatarFile | undefined,
    ): Promise<ICurrentUserResponse> {
        if (!file) {
            throw new BadRequestException('errors.user.avatarMissing');
        }

        if (!this.isAllowedAvatarMimeType(file.mimetype)) {
            throw new BadRequestException('errors.user.avatarUnsupportedType');
        }

        if (file.size > USER_AVATAR_MAX_BYTES) {
            throw new BadRequestException({
                code: 'errors.user.avatarTooLarge',
                params: { limitMb: USER_AVATAR_MAX_BYTES / (1024 * 1024) },
            });
        }

        const avatarKey = StorageKeys.userAvatar(userId);
        await this.storage.upload(file.buffer, avatarKey, file.mimetype);

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarKey },
        });

        return this.presentUser(user);
    }

    async clearAvatar(userId: string): Promise<ICurrentUserResponse> {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { avatarKey: null },
        });

        return this.presentUser(user);
    }

    async presentUser(user: User): Promise<ICurrentUserResponse> {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: await this.resolveAvatarUrl(user),
            hasCustomAvatar: user.avatarKey !== null,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private async resolveAvatarUrl(
        user: Pick<User, 'avatarKey' | 'avatarUrl'>,
    ): Promise<string | null> {
        if (user.avatarKey) {
            return this.storage.getSignedUrl(user.avatarKey);
        }

        return user.avatarUrl;
    }

    private isAllowedAvatarMimeType(mimeType: string): mimeType is TUserAvatarMimeType {
        return USER_AVATAR_ALLOWED_MIME_TYPES.some(
            (allowedMimeType) => allowedMimeType === mimeType,
        );
    }
}

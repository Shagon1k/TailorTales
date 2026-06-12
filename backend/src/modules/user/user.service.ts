import { Injectable, Logger } from '@nestjs/common';
import { type User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

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
}

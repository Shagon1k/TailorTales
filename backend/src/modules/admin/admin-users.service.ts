import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { type User, type Role, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IAdminUserListPage, IAdminUserSummary } from './admin.types.js';

/** User row shape returned by the list query — drives IAdminUserSummary mapping. */
type TUserRow = User & {
    subscription: { pricingTier: { name: string } } | null;
    _count: { stories: number };
};

function toSummary(row: TUserRow): IAdminUserSummary {
    return {
        id: row.id,
        email: row.email,
        name: row.name,
        avatarUrl: row.avatarUrl,
        role: row.role,
        suspendedAt: row.suspendedAt,
        createdAt: row.createdAt,
        subscriptionTier: row.subscription?.pricingTier.name ?? null,
        storiesCount: row._count.stories,
    };
}

@Injectable()
export class AdminUsersService {
    constructor(private readonly prisma: PrismaService) {}

    /** Paginated user list, newest first, optionally filtered by name/email substring. */
    async list(
        search: string | undefined,
        page: number,
        pageSize: number,
    ): Promise<IAdminUserListPage> {
        const where: Prisma.UserWhereInput = search
            ? {
                  OR: [
                      { email: { contains: search, mode: 'insensitive' } },
                      { name: { contains: search, mode: 'insensitive' } },
                  ],
              }
            : {};

        const [rows, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    subscription: { include: { pricingTier: { select: { name: true } } } },
                    _count: { select: { stories: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        return { items: rows.map(toSummary), total, page, pageSize };
    }

    /**
     * Change a user's role. Self-change is blocked so a SUPER_ADMIN cannot accidentally
     * demote themselves and lock the team out of role management.
     */
    async changeRole(actingUserId: string, targetUserId: string, role: Role): Promise<User> {
        if (targetUserId === actingUserId) {
            throw new BadRequestException('You cannot change your own role');
        }

        await this.requireUser(targetUserId);

        return this.prisma.user.update({ where: { id: targetUserId }, data: { role } });
    }

    /** Suspend (block auth) or reinstate a user. Self-suspension is blocked to avoid lockout. */
    async setSuspension(
        actingUserId: string,
        targetUserId: string,
        suspended: boolean,
    ): Promise<User> {
        if (targetUserId === actingUserId) {
            throw new BadRequestException('You cannot suspend your own account');
        }

        await this.requireUser(targetUserId);

        return this.prisma.user.update({
            where: { id: targetUserId },
            data: { suspendedAt: suspended ? new Date() : null },
        });
    }

    private async requireUser(id: string): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
        if (!user) {
            throw new NotFoundException(`User ${id} not found`);
        }
    }
}

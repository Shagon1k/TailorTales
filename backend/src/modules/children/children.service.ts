import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { type Child } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import { CreateChildDto } from './dto/create-child.dto.js';
import { UpdateChildDto } from './dto/update-child.dto.js';

@Injectable()
export class ChildrenService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly subscriptions: SubscriptionsService,
    ) {}

    findAllByUser(userId: string): Promise<Child[]> {
        return this.prisma.child.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    }

    async findOne(id: string, userId: string): Promise<Child> {
        const child = await this.prisma.child.findFirst({ where: { id, userId } });
        if (!child) throw new NotFoundException(`Child ${id} not found`);
        return child;
    }

    async create(userId: string, dto: CreateChildDto): Promise<Child> {
        const subscription = await this.subscriptions.getOrCreateForUser(userId);
        const limit = subscription.pricingTier.childrenLimit; // null = unlimited

        if (limit !== null) {
            const childCount = await this.prisma.child.count({ where: { userId } });
            if (childCount >= limit) {
                throw new ForbiddenException(
                    `Your plan allows up to ${limit} child profile(s) — upgrade to add more`,
                );
            }
        }

        return this.prisma.child.create({
            data: {
                userId,
                name: dto.name,
                birthdate: new Date(dto.birthdate),
                gender: dto.gender,
                interests: dto.interests ?? [],
                avatarUrl: dto.avatarUrl,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateChildDto): Promise<Child> {
        await this.findOne(id, userId);
        return this.prisma.child.update({
            where: { id },
            data: {
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.birthdate !== undefined && { birthdate: new Date(dto.birthdate) }),
                ...(dto.gender !== undefined && { gender: dto.gender }),
                ...(dto.interests !== undefined && { interests: dto.interests }),
                ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
            },
        });
    }

    async remove(id: string, userId: string): Promise<void> {
        await this.findOne(id, userId);
        await this.prisma.child.delete({ where: { id } });
    }
}

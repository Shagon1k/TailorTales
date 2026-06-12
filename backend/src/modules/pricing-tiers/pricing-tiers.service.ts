import { Injectable } from '@nestjs/common';
import type { PricingTier } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class PricingTiersService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(): Promise<PricingTier[]> {
        return this.prisma.pricingTier.findMany({ orderBy: { order: 'asc' } });
    }

    /** The free tier is the (single) tier without a Paddle price behind it. */
    findFreeTier(): Promise<PricingTier> {
        return this.prisma.pricingTier.findFirstOrThrow({
            where: { priceMonthly: 0 },
            orderBy: { order: 'asc' },
        });
    }

    findByPaddlePriceId(paddlePriceId: string): Promise<PricingTier | null> {
        return this.prisma.pricingTier.findFirst({ where: { paddlePriceId } });
    }
}

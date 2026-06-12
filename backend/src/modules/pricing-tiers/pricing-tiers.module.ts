import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { PricingTiersController } from './pricing-tiers.controller.js';
import { PricingTiersService } from './pricing-tiers.service.js';

@Module({
    imports: [PrismaModule],
    controllers: [PricingTiersController],
    providers: [PricingTiersService],
    exports: [PricingTiersService],
})
export class PricingTiersModule {}

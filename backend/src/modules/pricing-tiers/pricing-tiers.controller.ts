import { Controller, Get } from '@nestjs/common';
import type { PricingTier } from '../../generated/prisma/client.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { PricingTiersService } from './pricing-tiers.service.js';

@Controller('pricing')
export class PricingTiersController {
    constructor(private readonly pricingTiersService: PricingTiersService) {}

    @Public()
    @Get()
    findAll(): Promise<PricingTier[]> {
        return this.pricingTiersService.findAll();
    }
}

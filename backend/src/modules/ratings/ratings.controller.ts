import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import { RatingsService } from './ratings.service.js';
import type { IAdminRating } from './ratings.types.js';

/** Admin-only feedback view. The full admin UI is built in Phase 12. */
@Controller('admin/ratings')
@UseGuards(AdminGuard)
export class RatingsController {
    constructor(private readonly ratingsService: RatingsService) {}

    @Get()
    findAll(): Promise<IAdminRating[]> {
        return this.ratingsService.findAllForAdmin();
    }
}

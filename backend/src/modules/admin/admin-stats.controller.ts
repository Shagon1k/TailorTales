import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard.js';
import type { IAdminStats } from './admin.types.js';
import { AdminStatsService } from './admin-stats.service.js';

@Controller('admin/stats')
@UseGuards(AdminGuard)
export class AdminStatsController {
    constructor(private readonly adminStatsService: AdminStatsService) {}

    @Get()
    getStats(): Promise<IAdminStats> {
        return this.adminStatsService.getStats();
    }
}

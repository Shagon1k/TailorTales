import { Module } from '@nestjs/common';
import { AdminStatsController } from './admin-stats.controller.js';
import { AdminStatsService } from './admin-stats.service.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';

@Module({
    controllers: [AdminUsersController, AdminStatsController],
    providers: [AdminUsersService, AdminStatsService],
})
export class AdminModule {}

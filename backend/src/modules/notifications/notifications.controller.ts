import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) {}

    @Get('unread-count')
    async getUnreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
        const count = await this.notifications.getUnreadCount(user.id);
        return { count };
    }

    @Patch('read-all')
    async markAllRead(@CurrentUser() user: User): Promise<void> {
        await this.notifications.markAllRead(user.id);
    }
}

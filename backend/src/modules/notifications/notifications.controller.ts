import {
    Body,
    Controller,
    Get,
    type MessageEvent,
    Param,
    Patch,
    Sse,
    UseGuards,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { Notification, User } from '../../generated/prisma/client.js';
import { NotificationsService } from './notifications.service.js';
import type { INotificationPreferences } from './notification-preferences.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notifications: NotificationsService) {}

    /** Last 20 notifications, newest first — feeds the bell dropdown. */
    @Get()
    list(@CurrentUser() user: User): Promise<Notification[]> {
        return this.notifications.list(user.id);
    }

    /** SSE stream: `{ type: 'unread-count', count }` on connect and on every change. */
    @Sse('stream')
    stream(@CurrentUser() user: User): Observable<MessageEvent> {
        return this.notifications.streamUnreadCount(user.id);
    }

    @Get('unread-count')
    async getUnreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
        const count = await this.notifications.getUnreadCount(user.id);
        return { count };
    }

    @Get('preferences')
    getPreferences(@CurrentUser() user: User): Promise<INotificationPreferences> {
        return this.notifications.getPreferences(user.id);
    }

    @Patch('preferences')
    updatePreferences(
        @CurrentUser() user: User,
        @Body() dto: UpdateNotificationPreferencesDto,
    ): Promise<INotificationPreferences> {
        return this.notifications.updatePreferences(user.id, dto);
    }

    @Patch('read-all')
    async markAllRead(@CurrentUser() user: User): Promise<void> {
        await this.notifications.markAllRead(user.id);
    }

    /** Param route last so it can never shadow the static routes above. */
    @Patch(':id/read')
    async markRead(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
        await this.notifications.markRead(user.id, id);
    }
}

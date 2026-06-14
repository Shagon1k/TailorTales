import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module.js';
import { NotificationEmitterService } from './notification-emitter.service.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsController } from './notifications.controller.js';

@Module({
    imports: [EmailModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationEmitterService],
    exports: [NotificationsService, NotificationEmitterService],
})
export class NotificationsModule {}

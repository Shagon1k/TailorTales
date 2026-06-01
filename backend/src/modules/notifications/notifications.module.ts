import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module.js';
import { NotificationsService } from './notifications.service.js';

@Module({
    imports: [EmailModule],
    providers: [NotificationsService],
    exports: [NotificationsService],
})
export class NotificationsModule {}

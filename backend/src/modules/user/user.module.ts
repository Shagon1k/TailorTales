import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { AccountDeletionService } from './account-deletion.service.js';
import { DataExportService } from './data-export.service.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
    imports: [StorageModule, BillingModule],
    controllers: [UserController],
    providers: [UserService, DataExportService, AccountDeletionService],
    exports: [UserService],
})
export class UserModule {}

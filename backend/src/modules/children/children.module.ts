import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { ChildrenController } from './children.controller.js';
import { ChildrenService } from './children.service.js';

@Module({
    imports: [PrismaModule, SubscriptionsModule],
    controllers: [ChildrenController],
    providers: [ChildrenService],
})
export class ChildrenModule {}

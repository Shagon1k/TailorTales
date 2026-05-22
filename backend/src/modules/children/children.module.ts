import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { ChildrenController } from './children.controller.js';
import { ChildrenService } from './children.service.js';

@Module({
    imports: [PrismaModule],
    controllers: [ChildrenController],
    providers: [ChildrenService],
})
export class ChildrenModule {}

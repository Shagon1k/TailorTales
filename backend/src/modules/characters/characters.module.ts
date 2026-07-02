import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { CharactersController } from './characters.controller.js';
import { CharactersService } from './characters.service.js';

@Module({
    imports: [PrismaModule, AiModule, SubscriptionsModule],
    controllers: [CharactersController],
    providers: [CharactersService],
})
export class CharactersModule {}

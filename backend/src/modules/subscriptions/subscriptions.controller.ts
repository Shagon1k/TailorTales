import { Controller, Get } from '@nestjs/common';
import { type User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { SubscriptionsService } from './subscriptions.service.js';
import type { IUsageSummary } from './subscriptions.types.js';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    @Get('me')
    getMine(@CurrentUser() user: User): Promise<IUsageSummary> {
        return this.subscriptionsService.getUsageSummary(user.id);
    }
}

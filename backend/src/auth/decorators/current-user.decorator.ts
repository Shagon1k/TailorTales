import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { type User } from '../../generated/prisma/client.js';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as User;
});

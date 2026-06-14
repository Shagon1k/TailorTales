import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { type User, Role } from '../../../generated/prisma/client.js';

/**
 * Requires the SUPER_ADMIN role. Used to gate role changes — a plain ADMIN has every
 * other admin right but cannot promote, demote, or otherwise change roles.
 * Always used after JwtAuthGuard.
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user as User | undefined;

        if (user?.role !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('Super admin access required');
        }

        return true;
    }
}

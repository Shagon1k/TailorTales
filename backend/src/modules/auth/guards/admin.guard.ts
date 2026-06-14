import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { type User, Role } from '../../../generated/prisma/client.js';

const ADMIN_ROLES: ReadonlySet<Role> = new Set([Role.ADMIN, Role.SUPER_ADMIN]);

/**
 * Requires the requesting user to have an admin role (ADMIN or SUPER_ADMIN).
 * Always used after JwtAuthGuard (the user is already authenticated by the time this runs).
 * Returns 403 Forbidden — unlike ownership checks, revealing that an admin-only
 * route exists is not a security concern.
 */
@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user as User | undefined;

        if (!user || !ADMIN_ROLES.has(user.role)) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}

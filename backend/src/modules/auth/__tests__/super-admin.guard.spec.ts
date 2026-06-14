import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type User, Role } from '../../../generated/prisma/client.js';
import { SuperAdminGuard } from '../guards/super-admin.guard.js';

function contextForUser(user: User | undefined): ExecutionContext {
    return {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
}

describe('SuperAdminGuard', () => {
    let guard: SuperAdminGuard;

    beforeEach(() => {
        guard = new SuperAdminGuard();
    });

    describe('canActivate', () => {
        it('should allow a SUPER_ADMIN', () => {
            const context = contextForUser({ role: Role.SUPER_ADMIN } as User);

            expect(guard.canActivate(context)).toBe(true);
        });

        it('should reject a plain ADMIN', () => {
            const context = contextForUser({ role: Role.ADMIN } as User);

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });

        it('should reject a plain USER', () => {
            const context = contextForUser({ role: Role.USER } as User);

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });
    });
});

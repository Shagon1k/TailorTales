import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type User, Role } from '../../../generated/prisma/client.js';
import { AdminGuard } from '../guards/admin.guard.js';

function contextForUser(user: User | undefined): ExecutionContext {
    return {
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
    let guard: AdminGuard;

    beforeEach(() => {
        guard = new AdminGuard();
    });

    describe('canActivate', () => {
        it('should allow an ADMIN', () => {
            const context = contextForUser({ role: Role.ADMIN } as User);

            expect(guard.canActivate(context)).toBe(true);
        });

        it('should allow a SUPER_ADMIN', () => {
            const context = contextForUser({ role: Role.SUPER_ADMIN } as User);

            expect(guard.canActivate(context)).toBe(true);
        });

        it('should reject a plain USER', () => {
            const context = contextForUser({ role: Role.USER } as User);

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });

        it('should reject when there is no user', () => {
            const context = contextForUser(undefined);

            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });
    });
});

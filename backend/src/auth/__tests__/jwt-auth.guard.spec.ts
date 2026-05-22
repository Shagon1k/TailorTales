import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';

function makeContext(): ExecutionContext {
    return {
        getHandler: vi.fn(),
        getClass: vi.fn(),
    } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
    let guard: JwtAuthGuard;
    let getAllAndOverride: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        getAllAndOverride = vi.fn();
        guard = new JwtAuthGuard({ getAllAndOverride } as unknown as Reflector);
    });

    describe('canActivate', () => {
        it('should return true immediately for routes marked @Public()', () => {
            getAllAndOverride.mockReturnValue(true);

            const result = guard.canActivate(makeContext());

            expect(result).toBe(true);
        });

        it('should defer to the JWT Passport strategy for non-public routes', () => {
            getAllAndOverride.mockReturnValue(false);

            // super.canActivate requires a real HTTP context — here we only verify
            // the guard does NOT short-circuit and actually calls the parent.
            const superActivate = vi.spyOn(
                Object.getPrototypeOf(Object.getPrototypeOf(guard)) as { canActivate: () => unknown },
                'canActivate',
            );
            superActivate.mockReturnValue(true);

            const result = guard.canActivate(makeContext());

            expect(superActivate).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });
});

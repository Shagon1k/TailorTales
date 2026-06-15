import type { TUserRole } from '@/types/user.types';

/** Both admin tiers share every right except changing roles (see isSuperAdmin). */
export function isAdmin(role: TUserRole): boolean {
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** Only super admins may change roles. */
export function isSuperAdmin(role: TUserRole): boolean {
    return role === 'SUPER_ADMIN';
}

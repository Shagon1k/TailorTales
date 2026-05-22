import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IUser } from '@/types/user.types';

export async function getServerUser(): Promise<IUser | null> {
    try {
        return await apiFetchServer<IUser>('/me');
    } catch (err: unknown) {
        console.error('Server-side user fetch failed', err);
        return null;
    }
}

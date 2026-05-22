import { apiFetch } from '@/lib/api';
import type { IUser } from '@/types/user.types';

export const userApi = {
    getMe: (): Promise<IUser> => apiFetch<IUser>('/me'),
    updateMe: (name: string): Promise<IUser> =>
        apiFetch<IUser>('/me', {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        }),
};

import { apiFetch } from '@/lib/api';

export const authApi = {
    logout: (): Promise<void> => apiFetch('/auth/logout', { method: 'POST' }),
};

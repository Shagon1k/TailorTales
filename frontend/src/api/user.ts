import { apiFetch } from '@/lib/api';
import type { IUser } from '@/types/user.types';

export const userApi = {
    getMe: (): Promise<IUser> => apiFetch<IUser>('/me'),
    updateMe: (name: string): Promise<IUser> =>
        apiFetch<IUser>('/me', {
            method: 'PATCH',
            body: JSON.stringify({ name }),
        }),
    uploadAvatar: (avatar: File): Promise<IUser> => {
        const formData = new FormData();
        formData.append('avatar', avatar);

        return apiFetch<IUser>('/me/avatar', {
            method: 'POST',
            body: formData,
        });
    },
    deleteAvatar: (): Promise<IUser> =>
        apiFetch<IUser>('/me/avatar', {
            method: 'DELETE',
        }),
};

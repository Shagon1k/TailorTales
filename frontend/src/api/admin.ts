import { apiFetch } from '@/lib/api';
import type {
    IAdminStoriesFilter,
    IAdminStoryListPage,
    IAdminUserListPage,
    IAdminUsersFilter,
} from '@/types/admin.types';
import type { TUserRole } from '@/types/user.types';

export const adminApi = {
    getUsers: ({ search, page }: IAdminUsersFilter): Promise<IAdminUserListPage> => {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set('search', search);
        return apiFetch<IAdminUserListPage>(`/admin/users?${params.toString()}`);
    },

    changeUserRole: (id: string, role: TUserRole): Promise<void> =>
        apiFetch<void>(`/admin/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),

    setUserSuspension: (id: string, suspended: boolean): Promise<void> =>
        apiFetch<void>(`/admin/users/${id}/suspension`, {
            method: 'PATCH',
            body: JSON.stringify({ suspended }),
        }),

    getStories: ({ search, page }: IAdminStoriesFilter): Promise<IAdminStoryListPage> => {
        const params = new URLSearchParams({ page: String(page) });
        if (search) params.set('search', search);
        return apiFetch<IAdminStoryListPage>(`/admin/stories?${params.toString()}`);
    },

    deleteStory: (id: string): Promise<void> =>
        apiFetch<void>(`/admin/stories/${id}`, { method: 'DELETE' }),
};

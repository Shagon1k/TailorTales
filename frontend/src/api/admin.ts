import { apiFetch } from '@/lib/api';
import type {
    IAdminStoryRating,
    IAdminStoriesFilter,
    IAdminStoryListPage,
    IAdminUserListPage,
    IAdminUsersFilter,
    ICreateArtStylePayload,
    IUpdateArtStylePayload,
} from '@/types/admin.types';
import type { IArtStyle } from '@/types/art-style.types';
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

    getArtStyles: (): Promise<IArtStyle[]> => apiFetch<IArtStyle[]>('/admin/art-styles'),

    createArtStyle: (payload: ICreateArtStylePayload): Promise<IArtStyle> =>
        apiFetch<IArtStyle>('/admin/art-styles', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    updateArtStyle: (id: string, payload: IUpdateArtStylePayload): Promise<IArtStyle> =>
        apiFetch<IArtStyle>(`/admin/art-styles/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    reorderArtStyles: (orderedIds: string[]): Promise<IArtStyle[]> =>
        apiFetch<IArtStyle[]>('/admin/art-styles/reorder', {
            method: 'PATCH',
            body: JSON.stringify({ orderedIds }),
        }),

    generateArtStyleThumbnail: (id: string): Promise<IArtStyle> =>
        apiFetch<IArtStyle>(`/admin/art-styles/${id}/thumbnail`, { method: 'POST' }),

    getRatings: (): Promise<IAdminStoryRating[]> => apiFetch<IAdminStoryRating[]>('/admin/ratings'),
};

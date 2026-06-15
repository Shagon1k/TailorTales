import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
import type {
    IAdminStoriesFilter,
    IAdminStoryListPage,
    IAdminUserListPage,
    IAdminUsersFilter,
} from '@/types/admin.types';
import type { TUserRole } from '@/types/user.types';

export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

export function useAdminUsers(
    query: IAdminUsersFilter,
): ReturnType<typeof useQuery<IAdminUserListPage>> {
    return useQuery({
        queryKey: [...ADMIN_USERS_QUERY_KEY, query],
        queryFn: () => adminApi.getUsers(query),
        placeholderData: keepPreviousData,
    });
}

export function useChangeUserRole(): ReturnType<
    typeof useMutation<void, Error, { id: string; role: TUserRole }>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }) => adminApi.changeUserRole(id, role),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
    });
}

export function useSetUserSuspension(): ReturnType<
    typeof useMutation<void, Error, { id: string; suspended: boolean }>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, suspended }) => adminApi.setUserSuspension(id, suspended),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
    });
}

export const ADMIN_STORIES_QUERY_KEY = ['admin', 'stories'] as const;

export function useAdminStories(
    filter: IAdminStoriesFilter,
): ReturnType<typeof useQuery<IAdminStoryListPage>> {
    return useQuery({
        queryKey: [...ADMIN_STORIES_QUERY_KEY, filter],
        queryFn: () => adminApi.getStories(filter),
        placeholderData: keepPreviousData,
    });
}

export function useDeleteStory(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => adminApi.deleteStory(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_STORIES_QUERY_KEY }),
    });
}

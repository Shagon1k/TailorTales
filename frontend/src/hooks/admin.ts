import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin';
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

export const ADMIN_ART_STYLES_QUERY_KEY = ['admin', 'art-styles'] as const;

export function useAdminArtStyles(): ReturnType<typeof useQuery<IArtStyle[]>> {
    return useQuery({
        queryKey: ADMIN_ART_STYLES_QUERY_KEY,
        queryFn: () => adminApi.getArtStyles(),
    });
}

export function useCreateArtStyle(): ReturnType<
    typeof useMutation<IArtStyle, Error, ICreateArtStylePayload>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload) => adminApi.createArtStyle(payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_ART_STYLES_QUERY_KEY }),
    });
}

export function useUpdateArtStyle(): ReturnType<
    typeof useMutation<IArtStyle, Error, { id: string; payload: IUpdateArtStylePayload }>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => adminApi.updateArtStyle(id, payload),
        onMutate: async ({ id, payload }) => {
            await queryClient.cancelQueries({ queryKey: ADMIN_ART_STYLES_QUERY_KEY });
            const previous = queryClient.getQueryData<IArtStyle[]>(ADMIN_ART_STYLES_QUERY_KEY);
            if (previous) {
                queryClient.setQueryData<IArtStyle[]>(
                    ADMIN_ART_STYLES_QUERY_KEY,
                    previous.map((s) => (s.id === id ? { ...s, ...payload } : s)),
                );
            }
            return { previous };
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(ADMIN_ART_STYLES_QUERY_KEY, context.previous);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ADMIN_ART_STYLES_QUERY_KEY });
        },
    });
}

export function useReorderArtStyles(): ReturnType<
    typeof useMutation<IArtStyle[], Error, string[]>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orderedIds) => adminApi.reorderArtStyles(orderedIds),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_ART_STYLES_QUERY_KEY }),
    });
}

export function useGenerateArtStyleThumbnail(): ReturnType<
    typeof useMutation<IArtStyle, Error, string>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => adminApi.generateArtStyleThumbnail(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_ART_STYLES_QUERY_KEY }),
    });
}

export const ADMIN_RATINGS_QUERY_KEY = ['admin', 'ratings'] as const;

export function useAdminRatings(): ReturnType<typeof useQuery<IAdminStoryRating[]>> {
    return useQuery({
        queryKey: ADMIN_RATINGS_QUERY_KEY,
        queryFn: () => adminApi.getRatings(),
    });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/api/user';
import type { IUser } from '@/types/user.types';

export const USER_QUERY_KEY = ['user'] as const;

export function useUpdateUser(): ReturnType<typeof useMutation<IUser, Error, string>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => userApi.updateMe(name),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });
}

export function useUploadAvatar(): ReturnType<typeof useMutation<IUser, Error, File>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (avatar: File) => userApi.uploadAvatar(avatar),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });
}

export function useDeleteAvatar(): ReturnType<typeof useMutation<IUser, Error, void>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => userApi.deleteAvatar(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
    });
}

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

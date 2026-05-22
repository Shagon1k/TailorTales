import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { childrenApi, type ICreateChildPayload, type IUpdateChildPayload } from '@/api/children';
import type { IChild } from '@/types/child.types';

export const CHILDREN_QUERY_KEY = ['children'] as const;

export function useChildren(): ReturnType<typeof useQuery<IChild[]>> {
    return useQuery({ queryKey: CHILDREN_QUERY_KEY, queryFn: childrenApi.getAll });
}

export function useCreateChild(): ReturnType<typeof useMutation<IChild, Error, ICreateChildPayload>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: childrenApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHILDREN_QUERY_KEY }),
    });
}

export function useUpdateChild(): ReturnType<
    typeof useMutation<IChild, Error, { id: string; payload: IUpdateChildPayload }>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => childrenApi.update(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHILDREN_QUERY_KEY }),
    });
}

export function useDeleteChild(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: childrenApi.remove,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHILDREN_QUERY_KEY }),
    });
}

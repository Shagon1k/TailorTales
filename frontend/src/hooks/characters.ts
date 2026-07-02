import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    charactersApi,
    type ICreateCharacterFromPromptPayload,
    type ICreateCharacterPayload,
    type IUpdateCharacterPayload,
} from '@/api/characters';
import { SUBSCRIPTION_QUERY_KEY } from '@/hooks/subscription';
import type { ICharacter } from '@/types/character.types';

export const CHARACTERS_QUERY_KEY = ['characters'] as const;

export function useCharacters(): ReturnType<typeof useQuery<ICharacter[]>> {
    return useQuery({ queryKey: CHARACTERS_QUERY_KEY, queryFn: () => charactersApi.getAll() });
}

export function useCreateCharacter(): ReturnType<
    typeof useMutation<ICharacter, Error, ICreateCharacterPayload>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: charactersApi.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY }),
    });
}

export function useUpdateCharacter(): ReturnType<
    typeof useMutation<ICharacter, Error, { id: string; payload: IUpdateCharacterPayload }>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }) => charactersApi.update(id, payload),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY }),
    });
}

export function useDeleteCharacter(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => charactersApi.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY }),
    });
}

export function useCreateCharacterFromPrompt(): ReturnType<
    typeof useMutation<ICharacter, Error, ICreateCharacterFromPromptPayload>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: charactersApi.createFromPrompt,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY }),
    });
}

export function useGenerateCharacterPreview(): ReturnType<
    typeof useMutation<ICharacter, Error, string>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: charactersApi.generatePreview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY });
        },
    });
}

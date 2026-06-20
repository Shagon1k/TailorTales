import { apiFetch } from '@/lib/api';
import type { ICharacter } from '@/types/character.types';

export interface ICreateCharacterPayload {
    name: string;
    description: string;
    /** Owning child — every character belongs to one child. */
    childId: string;
}

export type IUpdateCharacterPayload = Partial<
    Pick<ICreateCharacterPayload, 'name' | 'description'>
>;

export const charactersApi = {
    getAll: (childId?: string): Promise<ICharacter[]> => {
        const query = childId ? `?childId=${encodeURIComponent(childId)}` : '';
        return apiFetch<ICharacter[]>(`/characters${query}`);
    },

    create: (payload: ICreateCharacterPayload): Promise<ICharacter> =>
        apiFetch<ICharacter>('/characters', { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: IUpdateCharacterPayload): Promise<ICharacter> =>
        apiFetch<ICharacter>(`/characters/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    remove: (id: string): Promise<void> =>
        apiFetch<void>(`/characters/${id}`, { method: 'DELETE' }),

    generatePreview: (id: string): Promise<ICharacter> =>
        apiFetch<ICharacter>(`/characters/${id}/preview`, { method: 'POST' }),
};

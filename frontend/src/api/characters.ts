import { apiFetch } from '@/lib/api';
import type { ICharacter, IUserCharacterSource } from '@/types/character.types';

export interface ICreateCharacterPayload {
    name: string;
    description: string;
    /** Owning child — every character belongs to one child. */
    childId: string;
    /** Free-form (`IMAGINED`) or the guided quiz (`QUIZ`). Server defaults to `IMAGINED`. */
    source: IUserCharacterSource;
}

export type IUpdateCharacterPayload = Partial<
    Pick<ICreateCharacterPayload, 'name' | 'description'>
>;

export interface ICreateCharacterFromPromptPayload {
    childId: string;
    /** Free-text idea the AI expands into a character. */
    prompt: string;
}

export const charactersApi = {
    getAll: (childId?: string): Promise<ICharacter[]> => {
        const query = childId ? `?childId=${encodeURIComponent(childId)}` : '';
        return apiFetch<ICharacter[]>(`/characters${query}`);
    },

    create: (payload: ICreateCharacterPayload): Promise<ICharacter> =>
        apiFetch<ICharacter>('/characters', { method: 'POST', body: JSON.stringify(payload) }),

    createFromPrompt: (payload: ICreateCharacterFromPromptPayload): Promise<ICharacter> =>
        apiFetch<ICharacter>('/characters/from-prompt', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

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

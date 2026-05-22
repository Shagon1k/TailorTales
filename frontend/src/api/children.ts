import { apiFetch } from '@/lib/api';
import type { IChild } from '@/types/child.types';

export interface ICreateChildPayload {
    name: string;
    birthdate: string;
    gender: IChild['gender'];
    interests?: string[];
    avatarUrl?: string;
}

export type IUpdateChildPayload = Partial<ICreateChildPayload>;

export const childrenApi = {
    getAll: (): Promise<IChild[]> => apiFetch<IChild[]>('/children'),

    getOne: (id: string): Promise<IChild> => apiFetch<IChild>(`/children/${id}`),

    create: (payload: ICreateChildPayload): Promise<IChild> =>
        apiFetch<IChild>('/children', { method: 'POST', body: JSON.stringify(payload) }),

    update: (id: string, payload: IUpdateChildPayload): Promise<IChild> =>
        apiFetch<IChild>(`/children/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

    remove: (id: string): Promise<void> =>
        apiFetch<void>(`/children/${id}`, { method: 'DELETE' }),
};

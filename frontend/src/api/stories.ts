import { apiFetch } from '@/lib/api';
import type { ICreateStoryPayload, IStoryDetail, IStorySummary } from '@/types/story.types';

export const storiesApi = {
    getAll: (): Promise<IStorySummary[]> => apiFetch<IStorySummary[]>('/stories'),

    getOne: (id: string): Promise<IStoryDetail> => apiFetch<IStoryDetail>(`/stories/${id}`),

    getPublic: (): Promise<IStorySummary[]> => apiFetch<IStorySummary[]>('/stories/public'),

    create: (payload: ICreateStoryPayload): Promise<IStorySummary> =>
        apiFetch<IStorySummary>('/stories', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    remove: (id: string): Promise<void> => apiFetch<void>(`/stories/${id}`, { method: 'DELETE' }),
};

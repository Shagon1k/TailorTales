import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IStoryDetail, IStorySummary } from '@/types/story.types';

export const storiesServerApi = {
    getAll: (): Promise<IStorySummary[]> => apiFetchServer<IStorySummary[]>('/stories'),

    getOne: (id: string): Promise<IStoryDetail> => apiFetchServer<IStoryDetail>(`/stories/${id}`),

    getPublic: (): Promise<IStorySummary[]> => apiFetchServer<IStorySummary[]>('/stories/public'),
};

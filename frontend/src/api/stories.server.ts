import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IStoryConfig, IStoryDetail, IStorySummary } from '@/types/story.types';

export const storiesServerApi = {
    getAll: (): Promise<IStorySummary[]> => apiFetchServer<IStorySummary[]>('/stories'),

    getOne: (id: string): Promise<IStoryDetail> => apiFetchServer<IStoryDetail>(`/stories/${id}`),

    getPublic: (): Promise<IStorySummary[]> => apiFetchServer<IStorySummary[]>('/stories/public'),

    getConfig: (): Promise<IStoryConfig> => apiFetchServer<IStoryConfig>('/stories/config'),
};

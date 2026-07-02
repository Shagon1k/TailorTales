import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IActiveJob } from '@/api/stories';
import type {
    IPublicStorySummary,
    IStoryConfig,
    IStoryDetail,
    IStorySummary,
} from '@/types/story.types';

export const storiesServerApi = {
    getAll: (): Promise<IStorySummary[]> => apiFetchServer<IStorySummary[]>('/stories'),

    getOne: (id: string): Promise<IStoryDetail> => apiFetchServer<IStoryDetail>(`/stories/${id}`),

    getPublic: (): Promise<IPublicStorySummary[]> =>
        apiFetchServer<IPublicStorySummary[]>('/stories/public'),

    getConfig: (): Promise<IStoryConfig> => apiFetchServer<IStoryConfig>('/stories/config'),

    getActiveJob: (): Promise<IActiveJob | null> =>
        apiFetchServer<IActiveJob | null>('/stories/active-job'),
};

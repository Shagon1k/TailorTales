import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IStoryBlueprintDetail, IStoryBlueprintSummary } from '@/types/story-blueprint.types';

export const storyBlueprintsServerApi = {
    getAll: (): Promise<IStoryBlueprintSummary[]> =>
        apiFetchServer<IStoryBlueprintSummary[]>('/story-blueprints'),

    getOne: (id: string): Promise<IStoryBlueprintDetail> =>
        apiFetchServer<IStoryBlueprintDetail>(`/story-blueprints/${id}`),
};

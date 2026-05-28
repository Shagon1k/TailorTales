import { apiFetch } from '@/lib/api';
import type { IStoryBlueprintDetail, IStoryBlueprintSummary } from '@/types/story-blueprint.types';

export const storyBlueprintsApi = {
    getAll: (): Promise<IStoryBlueprintSummary[]> =>
        apiFetch<IStoryBlueprintSummary[]>('/story-blueprints'),

    getOne: (id: string): Promise<IStoryBlueprintDetail> =>
        apiFetch<IStoryBlueprintDetail>(`/story-blueprints/${id}`),
};

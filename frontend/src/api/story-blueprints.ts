import { apiFetch } from '@/lib/api';
import type {
    IStoryBlueprintDetail,
    IStoryBlueprintSummary,
    ICreateStoryBlueprintPayload,
    IUpdateStoryBlueprintPayload,
} from '@/types/story-blueprint.types';

export const storyBlueprintsApi = {
    getAll: (): Promise<IStoryBlueprintSummary[]> =>
        apiFetch<IStoryBlueprintSummary[]>('/story-blueprints'),

    getOne: (id: string): Promise<IStoryBlueprintDetail> =>
        apiFetch<IStoryBlueprintDetail>(`/story-blueprints/${id}`),

    create: (payload: ICreateStoryBlueprintPayload): Promise<IStoryBlueprintDetail> =>
        apiFetch<IStoryBlueprintDetail>('/story-blueprints', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    update: (id: string, payload: IUpdateStoryBlueprintPayload): Promise<IStoryBlueprintDetail> =>
        apiFetch<IStoryBlueprintDetail>(`/story-blueprints/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }),

    remove: (id: string): Promise<void> =>
        apiFetch<void>(`/story-blueprints/${id}`, { method: 'DELETE' }),
};

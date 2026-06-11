import { apiFetch, getApiBaseUrl } from '@/lib/api';
import type {
    ICreateStoryPayload,
    IRegeneratePagePayload,
    IStoryDetail,
    IStorySummary,
} from '@/types/story.types';

export interface IActiveJob {
    jobId: string;
    storyId: string;
}

export interface IProgressSnapshot {
    type: 'snapshot' | 'page_complete' | 'completed' | 'failed';
    jobId: string;
    stage: string | null;
    status: string;
    completedPages: number;
    totalPages: number;
    error: string | null;
    pageOrder?: number;
}

export const storiesApi = {
    getAll: (): Promise<IStorySummary[]> => apiFetch<IStorySummary[]>('/stories'),

    getOne: (id: string): Promise<IStoryDetail> => apiFetch<IStoryDetail>(`/stories/${id}`),

    getPublic: (): Promise<IStorySummary[]> => apiFetch<IStorySummary[]>('/stories/public'),

    getActiveJob: (): Promise<IActiveJob | null> =>
        apiFetch<IActiveJob | null>('/stories/active-job'),

    create: (payload: ICreateStoryPayload): Promise<IStorySummary> =>
        apiFetch<IStorySummary>('/stories', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    generate: (id: string): Promise<{ jobId: string; storyId: string }> =>
        apiFetch<{ jobId: string; storyId: string }>(`/stories/${id}/generate`, {
            method: 'POST',
        }),

    remove: (id: string): Promise<void> => apiFetch<void>(`/stories/${id}`, { method: 'DELETE' }),

    regeneratePage: (
        storyId: string,
        pageOrder: number,
        payload: IRegeneratePagePayload,
    ): Promise<void> =>
        apiFetch<void>(`/stories/${storyId}/pages/${pageOrder}/regenerate`, {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /**
     * Opens an SSE connection to the story's progress stream.
     * Returns an EventSource; caller is responsible for closing it.
     */
    openProgressStream: (storyId: string): EventSource =>
        new EventSource(`${getApiBaseUrl()}/stories/${storyId}/progress`, {
            withCredentials: true,
        }),
};

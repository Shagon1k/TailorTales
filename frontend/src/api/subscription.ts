import { apiFetch } from '@/lib/api';
import type { IUsageSummary } from '@/types/subscription.types';

export const subscriptionApi = {
    getMine: (): Promise<IUsageSummary> => apiFetch<IUsageSummary>('/subscriptions/me'),
};

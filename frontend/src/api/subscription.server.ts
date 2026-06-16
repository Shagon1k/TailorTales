import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IUsageSummary } from '@/types/subscription.types';

export async function getServerSubscription(): Promise<IUsageSummary | null> {
    try {
        return await apiFetchServer<IUsageSummary>('/subscriptions/me');
    } catch {
        return null;
    }
}

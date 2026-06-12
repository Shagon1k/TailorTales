import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IPricingTier } from '@/types/pricing.types';

export const pricingServerApi = {
    getAll: (): Promise<IPricingTier[]> => apiFetchServer<IPricingTier[]>('/pricing'),
};

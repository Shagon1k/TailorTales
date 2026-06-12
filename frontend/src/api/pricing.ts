import { apiFetch } from '@/lib/api';
import type { IPricingTier } from '@/types/pricing.types';

export const pricingApi = {
    getAll: (): Promise<IPricingTier[]> => apiFetch<IPricingTier[]>('/pricing'),
};

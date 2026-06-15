import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IAdminStats } from '@/types/admin.types';

export const adminServerApi = {
    getStats: (): Promise<IAdminStats> => apiFetchServer<IAdminStats>('/admin/stats'),
};

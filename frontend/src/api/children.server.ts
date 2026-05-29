import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IChild } from '@/types/child.types';

export const childrenServerApi = {
    getAll: (): Promise<IChild[]> => apiFetchServer<IChild[]>('/children'),
};

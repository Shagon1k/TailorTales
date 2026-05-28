import 'server-only';

import { apiFetchServer } from '@/lib/api.server';
import type { IArtStyle } from '@/types/art-style.types';

export const artStylesServerApi = {
    getAll: (): Promise<IArtStyle[]> => apiFetchServer<IArtStyle[]>('/art-styles'),
};

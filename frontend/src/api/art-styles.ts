import { apiFetch } from '@/lib/api';
import type { IArtStyle } from '@/types/art-style.types';

export const artStylesApi = {
    getAll: (): Promise<IArtStyle[]> => apiFetch<IArtStyle[]>('/art-styles'),
};

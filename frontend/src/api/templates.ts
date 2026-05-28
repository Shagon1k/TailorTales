import { apiFetch } from '@/lib/api';
import type { ITemplateDetail, ITemplateSummary } from '@/types/template.types';

export const templatesApi = {
    getAll: (): Promise<ITemplateSummary[]> => apiFetch<ITemplateSummary[]>('/templates'),

    getOne: (id: string): Promise<ITemplateDetail> => apiFetch<ITemplateDetail>(`/templates/${id}`),
};

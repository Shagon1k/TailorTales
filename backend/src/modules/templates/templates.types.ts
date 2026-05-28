import type { Template } from '../../generated/prisma/client.js';

type TemplateWithoutKeys = Omit<Template, 'coverImageKey' | 'previewPageKeys'>;

/** Returned in list responses — systemPrompt excluded (LLM internals, verbose). */
export interface ITemplateSummary extends Omit<TemplateWithoutKeys, 'systemPrompt'> {
    coverImageUrl: string | null;
    previewPageUrls: string[];
}

/** Returned in detail + admin responses — includes systemPrompt. */
export interface ITemplateDetail extends TemplateWithoutKeys {
    coverImageUrl: string | null;
    previewPageUrls: string[];
}

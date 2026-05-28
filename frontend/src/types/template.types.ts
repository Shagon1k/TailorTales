import type { IStoryType } from './story.types';

export interface ITemplateSummary {
    id: string;
    name: string;
    description: string;
    type: IStoryType;
    createdById: string;
    createdAt: string;
    updatedAt: string;
    coverImageUrl: string | null;
    previewPageUrls: string[];
}

export interface ITemplateDetail extends ITemplateSummary {
    systemPrompt: string;
}

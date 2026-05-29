import type { IStoryType } from './story.types';

export interface IStoryBlueprintSummary {
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

export interface IStoryBlueprintDetail extends IStoryBlueprintSummary {
    systemPrompt: string;
}

export interface ICreateStoryBlueprintPayload {
    name: string;
    description: string;
    type: IStoryType;
    systemPrompt: string;
}

export type IUpdateStoryBlueprintPayload = Partial<ICreateStoryBlueprintPayload>;

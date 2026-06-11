export interface IArtStyle {
    id: string;
    name: string;
    slug: string;
    thumbnailUrl: string | null;
    promptPrefix: string;
    isActive: boolean;
    order: number;
    createdAt: string;
}

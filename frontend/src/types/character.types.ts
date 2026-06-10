export interface ICharacter {
    id: string;
    userId: string;
    childId: string | null;
    name: string;
    description: string;
    previewKey: string | null;
    createdAt: string;
    updatedAt: string;
}

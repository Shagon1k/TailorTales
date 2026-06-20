export type ICharacterSource = 'FROM_CHILD' | 'IMAGINED' | 'PROMPT' | 'PHOTO';

export interface ICharacter {
    id: string;
    userId: string;
    childId: string | null;
    source: ICharacterSource;
    name: string;
    description: string;
    previewKey: string | null;
    createdAt: string;
    updatedAt: string;
}

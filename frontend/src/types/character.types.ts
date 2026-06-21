export type ICharacterSource = 'IMAGINED' | 'QUIZ' | 'PHOTO';

/** Sources a client may set when creating a character (PHOTO is server-only/reserved). */
export type IUserCharacterSource = Extract<ICharacterSource, 'IMAGINED' | 'QUIZ'>;

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

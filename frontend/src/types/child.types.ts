export type IGender = 'MALE' | 'FEMALE';

export interface IChild {
    id: string;
    userId: string;
    name: string;
    birthdate: string;
    gender: IGender;
    interests: string[];
    avatarUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

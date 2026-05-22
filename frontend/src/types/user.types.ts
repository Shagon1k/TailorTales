export interface IUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt: string;
}

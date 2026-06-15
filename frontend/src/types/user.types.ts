export type TUserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface IUser {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    role: TUserRole;
    createdAt: string;
    updatedAt: string;
}

import type { Role, User } from '../../generated/prisma/client.js';

export interface IFindOrCreateUserResult {
    user: User;
    isNew: boolean;
}

export interface ICurrentUserResponse {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    hasCustomAvatar: boolean;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUploadedAvatarFile {
    buffer: Buffer;
    mimetype: string;
    size: number;
}

import type { User } from '../../generated/prisma/client.js';

export interface IAuthenticatedGoogleUser {
    user: User;
    isNew: boolean;
}

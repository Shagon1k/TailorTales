import type { Character } from '../../generated/prisma/client.js';

export interface ICharacterResponse extends Character {
    previewUrl: string | null;
}

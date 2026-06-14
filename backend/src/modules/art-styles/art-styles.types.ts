import type { ArtStyle } from '../../generated/prisma/client.js';

/**
 * Art style as returned to clients: the internal thumbnailKey is replaced by a freshly
 * signed thumbnailUrl (null until a thumbnail has been generated).
 */
export interface IArtStyle extends Omit<ArtStyle, 'thumbnailKey'> {
    thumbnailUrl: string | null;
}

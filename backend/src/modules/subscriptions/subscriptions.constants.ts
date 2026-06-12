import type { StoryType } from '../../generated/prisma/client.js';

/** Page-credit cost per story page (1 book page = 1 credit, 1 comic page = 2). */
export const CREDITS_PER_PAGE: Record<StoryType, number> = {
    BOOK: 1,
    COMIC: 2,
};

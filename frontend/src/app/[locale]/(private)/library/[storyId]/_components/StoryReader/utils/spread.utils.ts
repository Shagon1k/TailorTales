import type { IPage } from '@/types/story.types';

export interface ISpread {
    index: number;
    left: IPage;
    right: IPage | null; // null on odd-page-count final spread
}

/**
 * Group pages into two-page spreads (left + right).
 * The reader contract renders two generated pages per spread; an odd final page stands alone.
 */
export function getSpreads(pages: IPage[]): ISpread[] {
    const spreads: ISpread[] = [];
    for (let i = 0; i < pages.length; i += 2) {
        spreads.push({
            index: Math.floor(i / 2),
            left: pages[i],
            right: pages[i + 1] ?? null,
        });
    }
    return spreads;
}

/** Return the spread index that contains a given page order. */
export function spreadIndexForPage(pageOrder: number): number {
    return Math.floor((pageOrder - 1) / 2);
}

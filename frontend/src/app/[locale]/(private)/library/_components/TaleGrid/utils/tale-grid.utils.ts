import type { IStorySummary } from '@/types/story.types';

export type TFilter = 'ALL' | 'BOOK' | 'COMIC' | (string & {}); // string & {} = childId

export function applyFilter(stories: IStorySummary[], filter: TFilter): IStorySummary[] {
    if (filter === 'ALL') return stories;
    if (filter === 'BOOK') return stories.filter((s) => s.type === 'BOOK');
    if (filter === 'COMIC') return stories.filter((s) => s.type === 'COMIC');
    return stories.filter((s) => s.childId === filter);
}

'use client';

import { useState } from 'react';
import clsx from 'clsx';
import type { IChild } from '@/types/child.types';
import type { IStorySummary } from '@/types/story.types';
import { applyFilter, type TFilter } from './utils/tale-grid.utils';
import TaleCard from './components/TaleCard/TaleCard';
import styles from './TaleGrid.module.scss';

interface IFilterOption {
    value: TFilter;
    label: string;
}

export interface ITaleGridProps {
    readers: IChild[];
    stories: IStorySummary[];
}

export default function TaleGrid({
    readers,
    stories,
}: Readonly<ITaleGridProps>): React.ReactElement {
    const [filter, setFilter] = useState<TFilter>('ALL');
    const filtered = applyFilter(stories, filter);

    const filterOptions: IFilterOption[] = [
        { value: 'ALL', label: 'All' },
        ...readers.map((r) => ({ value: r.id, label: `For ${r.name}` })),
        { value: 'BOOK', label: 'Books' },
        { value: 'COMIC', label: 'Comics' },
    ];

    return (
        <section className={styles['tale-grid']} aria-labelledby="library-heading">
            <div className={styles['tale-grid__header']}>
                <div className={styles['tale-grid__heading-group']}>
                    <h2 id="library-heading" className={styles['tale-grid__title']}>
                        Your library
                    </h2>
                    <span className={styles['tale-grid__count']}>
                        {stories.length} {stories.length === 1 ? 'tale' : 'tales'}
                    </span>
                </div>

                <div
                    role="radiogroup"
                    aria-labelledby="tale-grid-filter-label"
                    className={styles['tale-grid__filters']}
                >
                    <span id="tale-grid-filter-label" className={styles['tale-grid__filter-label']}>
                        Filter
                    </span>
                    {filterOptions.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            onClick={() => setFilter(value)}
                            aria-checked={filter === value}
                            className={clsx(styles['tale-grid__chip'], {
                                [styles['m-active']]: filter === value,
                            })}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {filtered.length === 0 ? (
                <p className={styles['tale-grid__empty']}>No tales match this filter.</p>
            ) : (
                <ul className={styles['tale-grid__list']} aria-label="Tales">
                    {filtered.map((story) => (
                        <li key={story.id}>
                            <TaleCard story={story} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

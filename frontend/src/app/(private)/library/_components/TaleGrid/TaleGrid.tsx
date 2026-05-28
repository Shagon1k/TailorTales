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
                <h2 id="library-heading" className={styles['tale-grid__title']}>
                    Your library
                    <span
                        className={styles['tale-grid__count']}
                    >{` · ${stories.length} tales`}</span>
                </h2>

                <fieldset className={styles['tale-grid__filters']} role="radiogroup">
                    <legend className={styles['tale-grid__filter-label']}>Filter</legend>
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
                </fieldset>
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

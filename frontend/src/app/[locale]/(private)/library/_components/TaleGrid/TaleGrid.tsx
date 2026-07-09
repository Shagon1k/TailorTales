'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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
    const t = useTranslations('library');

    const filterOptions: IFilterOption[] = [
        { value: 'ALL', label: t('grid.filterOption.all') },
        ...readers.map((r) => ({
            value: r.id,
            label: t('grid.filterOption.child', { childName: r.name }),
        })),
        { value: 'BOOK', label: t('grid.filterOption.books') },
        { value: 'COMIC', label: t('grid.filterOption.comics') },
    ];

    return (
        <section className={styles['tale-grid']} aria-labelledby="library-heading">
            <div className={styles['tale-grid__header']}>
                <div className={styles['tale-grid__heading-group']}>
                    <h2 id="library-heading" className={styles['tale-grid__title']}>
                        {t('grid.heading')}
                    </h2>
                    <span className={styles['tale-grid__count']}>
                        {t('grid.count', { count: stories.length })}
                    </span>
                </div>

                <div className={styles['tale-grid__filter-block']}>
                    <span id="tale-grid-filter-label" className={styles['tale-grid__filter-label']}>
                        {t('grid.filterLabel')}
                    </span>
                    <div
                        role="radiogroup"
                        aria-labelledby="tale-grid-filter-label"
                        className={styles['tale-grid__filters']}
                    >
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
            </div>

            {filtered.length === 0 ? (
                <p className={styles['tale-grid__empty']}>{t('grid.empty')}</p>
            ) : (
                <ul className={styles['tale-grid__list']} aria-label={t('grid.ariaLabel')}>
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

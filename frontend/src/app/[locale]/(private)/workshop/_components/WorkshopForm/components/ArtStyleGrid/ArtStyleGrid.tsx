'use client';

import clsx from 'clsx';
import type { IArtStyle } from '@/types/art-style.types';
import styles from './ArtStyleGrid.module.scss';

export interface IArtStyleGridProps {
    artStyles: IArtStyle[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ArtStyleGrid({
    artStyles,
    selectedId,
    onSelect,
}: Readonly<IArtStyleGridProps>): React.ReactElement {
    return (
        <div role="radiogroup" aria-label="Art style" className={styles['art-style-grid']}>
            {artStyles.map((style) => {
                const isSelected = selectedId === style.id;

                return (
                    <button
                        key={style.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onSelect(style.id)}
                        className={clsx(styles['art-style-grid__item'], {
                            [styles['m-selected']]: isSelected,
                        })}
                    >
                        <div className={styles['art-style-grid__thumb']}>
                            {style.thumbnailUrl ? (
                                <img
                                    src={style.thumbnailUrl}
                                    alt={style.name}
                                    className={styles['art-style-grid__img']}
                                />
                            ) : (
                                <span
                                    className={styles['art-style-grid__placeholder']}
                                    aria-hidden="true"
                                >
                                    {style.name[0]}
                                </span>
                            )}
                            {isSelected && (
                                <span
                                    className={styles['art-style-grid__check']}
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                            )}
                        </div>
                        <span className={styles['art-style-grid__label']}>{style.name}</span>
                    </button>
                );
            })}
        </div>
    );
}

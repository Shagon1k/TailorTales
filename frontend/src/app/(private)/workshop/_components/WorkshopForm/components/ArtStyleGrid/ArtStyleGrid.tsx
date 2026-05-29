'use client';

import Image from 'next/image';
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
                            <Image
                                src={style.thumbnailUrl}
                                alt={style.name}
                                fill
                                sizes="(min-width: 640px) 25vw, 50vw"
                                className={styles['art-style-grid__img']}
                            />
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

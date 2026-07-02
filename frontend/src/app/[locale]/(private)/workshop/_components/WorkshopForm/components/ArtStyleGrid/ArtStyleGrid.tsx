'use client';

import type { IArtStyle } from '@/types/art-style.types';
import SelectableCard, { SelectableCardGroup } from '@/components/ui/SelectableCard/SelectableCard';
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
        <SelectableCardGroup
            value={selectedId}
            onChange={(nextValue) => {
                if (nextValue !== null) onSelect(nextValue);
            }}
            label="Art style"
        >
            <div className={styles['art-style-grid']}>
                {artStyles.map((style) => (
                    <SelectableCard key={style.id} value={style.id} ariaLabel={style.name}>
                        <div className={styles['art-style-grid__body']}>
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
                            </div>
                            <span className={styles['art-style-grid__label']}>{style.name}</span>
                        </div>
                    </SelectableCard>
                ))}
            </div>
        </SelectableCardGroup>
    );
}

'use client';

import type { IChild } from '@/types/child.types';
import styles from './ReaderSelector.module.scss';

export interface IReaderSelectorProps {
    items: IChild[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export default function ReaderSelector({
    items,
    selectedId,
    onSelect,
}: Readonly<IReaderSelectorProps>): React.ReactElement {
    return (
        <ul className={styles['reader-selector']} aria-label="Select reader">
            {items.map((child) => (
                <li key={child.id}>
                    <button
                        type="button"
                        onClick={() => onSelect(child.id)}
                        aria-pressed={selectedId === child.id}
                        className={styles['reader-selector__item']}
                        data-selected={selectedId === child.id || undefined}
                    >
                        <span className={styles['reader-selector__name']}>{child.name}</span>
                        {selectedId === child.id && (
                            <span className={styles['reader-selector__check']} aria-hidden="true">
                                ✓
                            </span>
                        )}
                    </button>
                </li>
            ))}
        </ul>
    );
}

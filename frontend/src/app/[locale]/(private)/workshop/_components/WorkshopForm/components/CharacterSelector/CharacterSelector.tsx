'use client';

import { useTranslations } from 'next-intl';
import type { ICharacter } from '@/types/character.types';
import styles from './CharacterSelector.module.scss';

export interface ICharacterSelectorProps {
    items: ICharacter[];
    /** null = no character chosen (the story follows the reader). */
    selectedId: string | null;
    onSelect: (id: string | null) => void;
}

export default function CharacterSelector({
    items,
    selectedId,
    onSelect,
}: Readonly<ICharacterSelectorProps>): React.ReactElement {
    const t = useTranslations('workshop.form.characterPicker');

    const options: Array<{ id: string | null; name: string }> = [
        { id: null, name: t('none') },
        ...items.map((character) => ({ id: character.id, name: character.name })),
    ];

    return (
        <ul className={styles['character-selector']} aria-label={t('listLabel')}>
            {options.map((option) => {
                const isSelected = selectedId === option.id;
                return (
                    <li key={option.id ?? '__none__'}>
                        <button
                            type="button"
                            onClick={() => onSelect(option.id)}
                            aria-pressed={isSelected}
                            className={styles['character-selector__item']}
                            data-selected={isSelected || undefined}
                        >
                            <span className={styles['character-selector__name']}>
                                {option.name}
                            </span>
                            {isSelected && (
                                <span
                                    className={styles['character-selector__check']}
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { ICharacter } from '@/types/character.types';
import styles from './CharacterSelector.module.scss';

export interface ICharacterSelectorProps {
    items: ICharacter[];
    /** null = no fixed character chosen for the story. */
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
                            aria-label={option.name}
                            className={styles['character-selector__item']}
                            data-selected={isSelected || undefined}
                        >
                            {option.id === null ? (
                                <div className={styles['character-selector__content']}>
                                    <span className={styles['character-selector__name']}>
                                        {option.name}
                                    </span>
                                </div>
                            ) : (
                                <CharacterOptionCard
                                    character={items.find((item) => item.id === option.id)!}
                                />
                            )}
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

interface ICharacterOptionCardProps {
    character: ICharacter;
}

function CharacterOptionCard({
    character,
}: Readonly<ICharacterOptionCardProps>): React.ReactElement {
    return (
        <div className={styles['character-selector__content']}>
            <div className={styles['character-selector__thumb']}>
                {character.previewUrl ? (
                    <Image
                        src={character.previewUrl}
                        alt=""
                        fill
                        sizes="64px"
                        unoptimized
                        className={styles['character-selector__thumb-img']}
                    />
                ) : (
                    <span
                        className={styles['character-selector__thumb-fallback']}
                        aria-hidden="true"
                    >
                        {character.name.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div className={styles['character-selector__text']}>
                <span className={styles['character-selector__name']}>{character.name}</span>
                <span className={styles['character-selector__description']}>
                    {character.description}
                </span>
            </div>
        </div>
    );
}

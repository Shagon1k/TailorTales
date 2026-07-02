'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { ICharacter } from '@/types/character.types';
import SelectableCard, { SelectableCardGroup } from '@/components/ui/SelectableCard/SelectableCard';
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
        <SelectableCardGroup value={selectedId} onChange={onSelect} label={t('listLabel')}>
            <ul className={styles['character-selector']}>
                {options.map((option) => (
                    <li key={option.id ?? '__none__'}>
                        <SelectableCard value={option.id} ariaLabel={option.name}>
                            {option.id === null ? (
                                <NoCharacterOption label={option.name} />
                            ) : (
                                <CharacterOptionCard
                                    character={items.find((item) => item.id === option.id)!}
                                />
                            )}
                        </SelectableCard>
                    </li>
                ))}
            </ul>
        </SelectableCardGroup>
    );
}

function NoCharacterOption({ label }: Readonly<{ label: string }>): React.ReactElement {
    const [name, description] = label.split(/\s+[—-]\s+/, 2);

    return (
        <div className={styles['character-selector__body']}>
            <div className={styles['character-selector__thumb']} aria-hidden="true">
                <span className={styles['character-selector__thumb-fallback']}>—</span>
            </div>
            <div className={styles['character-selector__content']}>
                <span className={styles['character-selector__name']}>{name}</span>
                {description && (
                    <span className={styles['character-selector__description']}>{description}</span>
                )}
            </div>
        </div>
    );
}

interface ICharacterOptionCardProps {
    character: ICharacter;
}

function CharacterOptionCard({
    character,
}: Readonly<ICharacterOptionCardProps>): React.ReactElement {
    return (
        <div className={styles['character-selector__body']}>
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
            <div className={styles['character-selector__content']}>
                <span className={styles['character-selector__name']}>{character.name}</span>
                <span className={styles['character-selector__description']}>
                    {character.description}
                </span>
            </div>
        </div>
    );
}

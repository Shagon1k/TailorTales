'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Card from '@/components/ui/Card/Card';
import Tag from '@/components/ui/Tag/Tag';
import Button from '@/components/ui/Button/Button';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
import styles from './ChildCard.module.scss';

interface IChildCardProps {
    child: IChild;
    characters: ICharacter[];
    onEdit: (child: IChild) => void;
    onDelete: (child: IChild) => void;
    onCharacterAdd: (child: IChild) => void;
    onCharacterEdit: (child: IChild, character: ICharacter) => void;
    onCharacterDelete: (character: ICharacter) => void;
}

function getAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const hasBirthdayPassed =
        now.getMonth() > birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    return hasBirthdayPassed ? years : years - 1;
}

export default function ChildCard({
    child,
    characters,
    onEdit,
    onDelete,
    onCharacterAdd,
    onCharacterEdit,
    onCharacterDelete,
}: Readonly<IChildCardProps>): React.ReactElement {
    const t = useTranslations('account.childCard');
    const age = getAge(child.birthdate);
    const ageLabel = age === 0 ? t('ageLabel.infant') : t('ageLabel.years', { age });
    const genderLabel = child.gender === 'MALE' ? t('gender.male') : t('gender.female');

    return (
        <Card variant="dark" size="md">
            <div className={styles.body}>
                <div className={styles.info}>
                    <h4 className={styles.name}>{child.name}</h4>
                    <p className={styles.meta}>
                        {ageLabel} · {genderLabel}
                    </p>
                </div>

                {child.interests.length > 0 && (
                    <div className={styles.interests}>
                        {child.interests.map((interest) => (
                            <Tag key={interest} variant="filled">
                                {interest}
                            </Tag>
                        ))}
                    </div>
                )}

                <div className={styles.character}>
                    <span className={styles['character__label']}>{t('characterLabel')}</span>
                    {characters.length > 0 ? (
                        <ul className={styles['character__list']}>
                            {characters.map((character) => (
                                <li key={character.id} className={styles['character__item']}>
                                    <div className={styles['character__preview']}>
                                        {character.previewUrl ? (
                                            <Image
                                                src={character.previewUrl}
                                                alt=""
                                                fill
                                                sizes="56px"
                                                unoptimized
                                                className={styles['character__preview-img']}
                                            />
                                        ) : (
                                            <span
                                                className={styles['character__preview-fallback']}
                                                aria-hidden="true"
                                            >
                                                {character.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles['character__text']}>
                                        <p className={styles['character__name']}>
                                            {character.name}
                                        </p>
                                        <p className={styles['character__description']}>
                                            {character.description}
                                        </p>
                                    </div>
                                    <div className={styles['character__item-actions']}>
                                        <Button
                                            variant="quiet"
                                            onClick={() => onCharacterEdit(child, character)}
                                            aria-label={t('editCharacterAriaLabel', {
                                                characterName: character.name,
                                            })}
                                        >
                                            {t('editCharacterButton')}
                                        </Button>
                                        <Button
                                            variant="quiet"
                                            onClick={() => onCharacterDelete(character)}
                                            aria-label={t('deleteCharacterAriaLabel', {
                                                characterName: character.name,
                                            })}
                                        >
                                            {t('deleteCharacterButton')}
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles['character__empty']}>{t('noCharacter')}</p>
                    )}
                    <Button
                        variant="secondary"
                        onClick={() => onCharacterAdd(child)}
                        aria-label={t('addCharacterAriaLabel', { childName: child.name })}
                    >
                        {t('addCharacterButton')}
                    </Button>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="quiet"
                        onClick={() => onEdit(child)}
                        aria-label={t('editAriaLabel', { childName: child.name })}
                    >
                        {t('editButton')}
                    </Button>
                    <Button
                        variant="quiet"
                        onClick={() => onDelete(child)}
                        aria-label={t('deleteAriaLabel', { childName: child.name })}
                    >
                        {t('deleteButton')}
                    </Button>
                </div>
            </div>
        </Card>
    );
}

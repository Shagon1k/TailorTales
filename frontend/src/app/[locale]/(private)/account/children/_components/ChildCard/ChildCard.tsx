'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Card from '@/components/ui/Card/Card';
import Tag from '@/components/ui/Tag/Tag';
import Button from '@/components/ui/Button/Button';
import Modal from '@/components/ui/Modal/Modal';
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
    onCharacterGeneratePreview: (character: ICharacter) => void;
    canAddCharacter?: boolean;
    canGenerateCharacterPreview?: boolean;
    generatingCharacterPreviewId?: string | null;
    addCharacterHint?: string | null;
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
    onCharacterGeneratePreview,
    canAddCharacter = true,
    canGenerateCharacterPreview = true,
    generatingCharacterPreviewId = null,
    addCharacterHint = null,
}: Readonly<IChildCardProps>): React.ReactElement {
    const t = useTranslations('account.childCard');
    const age = getAge(child.birthdate);
    const ageLabel = age === 0 ? t('ageLabel.infant') : t('ageLabel.years', { age });
    const genderLabel = child.gender === 'MALE' ? t('gender.male') : t('gender.female');
    const [previewCharacter, setPreviewCharacter] = useState<ICharacter | null>(null);

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
                                    <div className={styles['character__item-main']}>
                                        <button
                                            type="button"
                                            className={styles['character__preview']}
                                            onClick={() => {
                                                if (character.previewUrl) {
                                                    setPreviewCharacter(character);
                                                }
                                            }}
                                            disabled={!character.previewUrl}
                                            aria-label={t('previewCharacterAriaLabel', {
                                                characterName: character.name,
                                            })}
                                        >
                                            {character.previewUrl ? (
                                                <Image
                                                    src={character.previewUrl}
                                                    alt=""
                                                    fill
                                                    sizes="104px"
                                                    unoptimized
                                                    className={styles['character__preview-img']}
                                                />
                                            ) : (
                                                <span
                                                    className={
                                                        styles['character__preview-fallback']
                                                    }
                                                    aria-hidden="true"
                                                >
                                                    {character.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </button>
                                        <div className={styles['character__text']}>
                                            <p className={styles['character__name']}>
                                                {character.name}
                                            </p>
                                            <p className={styles['character__description']}>
                                                {character.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={styles['character__item-actions']}>
                                        <button
                                            type="button"
                                            className={`${styles['character__utility-action']} ${generatingCharacterPreviewId === character.id ? styles['m-loading'] : ''}`}
                                            disabled={
                                                !canGenerateCharacterPreview ||
                                                generatingCharacterPreviewId !== null
                                            }
                                            onClick={() => onCharacterGeneratePreview(character)}
                                            aria-label={
                                                character.previewUrl
                                                    ? t('regenerateCharacterPreviewAriaLabel', {
                                                          characterName: character.name,
                                                      })
                                                    : t('generateCharacterPreviewAriaLabel', {
                                                          characterName: character.name,
                                                      })
                                            }
                                            aria-busy={
                                                generatingCharacterPreviewId === character.id
                                            }
                                        >
                                            <span
                                                className={styles['character__utility-icon']}
                                                aria-hidden="true"
                                            >
                                                <svg
                                                    viewBox="0 0 16 16"
                                                    fill="none"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M13.333 3.333v3.334H10"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        d="M12.774 6.667a5.333 5.333 0 1 1-1.183-2.15l1.742 2.15"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                        </button>
                                        <Button
                                            variant="quiet"
                                            onClick={() => onCharacterEdit(child, character)}
                                            aria-label={t('editCharacterAriaLabel', {
                                                characterName: character.name,
                                            })}
                                        >
                                            <span className={styles['character__action-label']}>
                                                {t('editCharacterButton')}
                                            </span>
                                        </Button>
                                        <Button
                                            variant="quiet"
                                            onClick={() => onCharacterDelete(character)}
                                            aria-label={t('deleteCharacterAriaLabel', {
                                                characterName: character.name,
                                            })}
                                        >
                                            <span className={styles['character__action-label']}>
                                                {t('deleteCharacterButton')}
                                            </span>
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
                        disabled={!canAddCharacter}
                        aria-label={t('addCharacterAriaLabel', { childName: child.name })}
                    >
                        {t('addCharacterButton')}
                    </Button>
                    {addCharacterHint && (
                        <p className={styles['character__hint']}>{addCharacterHint}</p>
                    )}
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="quiet"
                        onClick={() => onEdit(child)}
                        aria-label={t('editAriaLabel', { childName: child.name })}
                    >
                        <span className={styles['character__action-label']}>
                            {t('editChildButton')}
                        </span>
                    </Button>
                    <Button
                        variant="quiet"
                        onClick={() => onDelete(child)}
                        aria-label={t('deleteAriaLabel', { childName: child.name })}
                    >
                        <span className={styles['character__action-label']}>
                            {t('deleteChildButton')}
                        </span>
                    </Button>
                </div>
            </div>

            <Modal
                opened={previewCharacter !== null}
                onClose={() => setPreviewCharacter(null)}
                title={previewCharacter?.name ?? ''}
                size="lg"
            >
                {previewCharacter?.previewUrl && (
                    <div className={styles['preview-modal']}>
                        <div className={styles['preview-modal__image']}>
                            <Image
                                src={previewCharacter.previewUrl}
                                alt={previewCharacter.name}
                                fill
                                sizes="min(80vw, 520px)"
                                unoptimized
                                className={styles['preview-modal__img']}
                            />
                        </div>
                        <p className={styles['preview-modal__description']}>
                            {previewCharacter.description}
                        </p>
                    </div>
                )}
            </Modal>
        </Card>
    );
}

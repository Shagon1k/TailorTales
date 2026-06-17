'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card/Card';
import Tag from '@/components/ui/Tag/Tag';
import Button from '@/components/ui/Button/Button';
import type { IChild } from '@/types/child.types';
import type { ICharacter } from '@/types/character.types';
import styles from './ChildCard.module.scss';

interface IChildCardProps {
    child: IChild;
    character: ICharacter | null;
    onEdit: (child: IChild) => void;
    onDelete: (child: IChild) => void;
    onCharacterEdit: (child: IChild) => void;
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
    character,
    onEdit,
    onDelete,
    onCharacterEdit,
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
                    {character ? (
                        <>
                            <p className={styles['character__name']}>{character.name}</p>
                            <p className={styles['character__description']}>
                                {character.description}
                            </p>
                        </>
                    ) : (
                        <p className={styles['character__empty']}>{t('noCharacter')}</p>
                    )}
                    <Button
                        variant="quiet"
                        onClick={() => onCharacterEdit(child)}
                        aria-label={
                            character
                                ? t('editCharacterAriaLabel', { childName: child.name })
                                : t('addCharacterAriaLabel', { childName: child.name })
                        }
                    >
                        {character ? t('editCharacterButton') : t('addCharacterButton')}
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
                        variant="secondary"
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

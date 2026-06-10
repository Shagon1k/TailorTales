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

function getAgeLabel(birthdate: string): string {
    const birth = new Date(birthdate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const hasBirthdayPassed =
        now.getMonth() > birth.getMonth() ||
        (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    const age = hasBirthdayPassed ? years : years - 1;
    return age === 0 ? 'Under 1 year' : `${age} year${age === 1 ? '' : 's'} old`;
}

export default function ChildCard({
    child,
    character,
    onEdit,
    onDelete,
    onCharacterEdit,
}: Readonly<IChildCardProps>): React.ReactElement {
    return (
        <Card variant="dark" size="md">
            <div className={styles.body}>
                <div className={styles.info}>
                    <h4 className={styles.name}>{child.name}</h4>
                    <p className={styles.meta}>
                        {getAgeLabel(child.birthdate)} · {child.gender === 'MALE' ? 'Boy' : 'Girl'}
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
                    <span className={styles['character__label']}>Character</span>
                    {character ? (
                        <>
                            <p className={styles['character__name']}>{character.name}</p>
                            <p className={styles['character__description']}>
                                {character.description}
                            </p>
                        </>
                    ) : (
                        <p className={styles['character__empty']}>No character yet.</p>
                    )}
                    <Button
                        variant="quiet"
                        onClick={() => onCharacterEdit(child)}
                        aria-label={
                            character
                                ? `Edit character for ${child.name}`
                                : `Add character for ${child.name}`
                        }
                    >
                        {character ? 'Edit character' : 'Add character'}
                    </Button>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="quiet"
                        onClick={() => onEdit(child)}
                        aria-label={`Edit ${child.name}`}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => onDelete(child)}
                        aria-label={`Delete ${child.name}`}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </Card>
    );
}

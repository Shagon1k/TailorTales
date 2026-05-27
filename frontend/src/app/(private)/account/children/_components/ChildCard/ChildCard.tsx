import Card from '@/components/ui/Card/Card';
import Tag from '@/components/ui/Tag/Tag';
import Button from '@/components/ui/Button/Button';
import type { IChild } from '@/types/child.types';
import styles from './ChildCard.module.scss';

interface IChildCardProps {
    child: IChild;
    onEdit: (child: IChild) => void;
    onDelete: (child: IChild) => void;
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
    onEdit,
    onDelete,
}: Readonly<IChildCardProps>): React.ReactElement {
    return (
        <Card variant="dark" size="md">
            <div className={styles.body}>
                <div className={styles.header}>
                    <div className={styles.info}>
                        <h4 className={styles.name}>{child.name}</h4>
                        <p className={styles.meta}>
                            {getAgeLabel(child.birthdate)} ·{' '}
                            {child.gender === 'MALE' ? 'Boy' : 'Girl'}
                        </p>
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

                {child.interests.length > 0 && (
                    <div className={styles.interests}>
                        {child.interests.map((interest) => (
                            <Tag key={interest} variant="filled">
                                {interest}
                            </Tag>
                        ))}
                    </div>
                )}
            </div>
        </Card>
    );
}

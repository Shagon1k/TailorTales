'use client';

import SelectableCard from '@/components/ui/SelectableCard/SelectableCard';
import styles from './RadioCard.module.scss';

// ── Atom ─────────────────────────────────────────────────────────────────────

export interface IRadioCardProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    /** Required when used inside RadioCardGroup. */
    value?: string;
    /** Used for standalone (outside a group). */
    selected?: boolean;
    /** Used for standalone (outside a group). */
    onChange?: () => void;
    disabled?: boolean;
}

export default function RadioCard({
    title,
    description,
    value,
    selected = false,
    onChange,
    disabled = false,
}: Readonly<IRadioCardProps>): React.ReactElement {
    return (
        <SelectableCard
            value={value}
            selected={selected}
            onSelect={onChange}
            disabled={disabled}
            ariaLabel={typeof title === 'string' ? title : undefined}
            showBadgePlaceholder
        >
            <div className={styles['radio-card__body']}>
                <div className={styles['radio-card__header']}>
                    <span className={styles['radio-card__title']}>{title}</span>
                </div>
                {description && <p className={styles['radio-card__description']}>{description}</p>}
            </div>
        </SelectableCard>
    );
}

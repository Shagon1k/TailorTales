'use client';

import { createContext, use } from 'react';
import clsx from 'clsx';
import styles from './RadioCard.module.scss';

// ── Group context ────────────────────────────────────────────────────────────

interface IRadioCardGroupContext {
    value: string | null;
    onChange: (value: string) => void;
    disabled: boolean;
}

export const RadioCardGroupContext = createContext<IRadioCardGroupContext | null>(null);

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

function CheckIcon(): React.ReactElement {
    return (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path
                d="M1 4l3 3 5-5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export default function RadioCard({
    title,
    description,
    value,
    selected = false,
    onChange,
    disabled = false,
}: Readonly<IRadioCardProps>): React.ReactElement {
    const group = use(RadioCardGroupContext);

    const isSelected = group ? group.value === value : selected;
    const isDisabled = disabled || (group?.disabled ?? false);
    const handleChange = group && value ? (): void => group.onChange(value) : onChange;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={handleChange}
            className={clsx(styles['radio-card'], { [styles['m-selected']]: isSelected })}
        >
            <div className={styles['radio-card__header']}>
                <span className={styles['radio-card__title']}>{title}</span>
                <span className={styles['radio-card__indicator']} aria-hidden="true">
                    {isSelected && <CheckIcon />}
                </span>
            </div>
            {description && (
                <p className={styles['radio-card__description']}>{description}</p>
            )}
        </button>
    );
}

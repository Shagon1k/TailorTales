'use client';

import { createContext, use } from 'react';
import clsx from 'clsx';
import SelectionBadge from '@/components/ui/SelectionBadge/SelectionBadge';
import styles from './SelectableCard.module.scss';

interface ISelectableCardGroupContext {
    value: string | null;
    onChange: (value: string | null) => void;
    disabled: boolean;
}

const SelectableCardGroupContext = createContext<ISelectableCardGroupContext | null>(null);

export interface ISelectableCardGroupProps {
    value: string | null;
    onChange: (value: string | null) => void;
    children: React.ReactNode;
    label?: string;
    disabled?: boolean;
}

export function SelectableCardGroup({
    value,
    onChange,
    children,
    label,
    disabled = false,
}: Readonly<ISelectableCardGroupProps>): React.ReactElement {
    return (
        <SelectableCardGroupContext value={{ value, onChange, disabled }}>
            <div role="radiogroup" aria-label={label}>
                {children}
            </div>
        </SelectableCardGroupContext>
    );
}

export interface ISelectableCardProps {
    children: React.ReactNode;
    value?: string | null;
    selected?: boolean;
    onSelect?: () => void;
    disabled?: boolean;
    ariaLabel?: string;
    showBadgePlaceholder?: boolean;
}

export default function SelectableCard({
    children,
    value,
    selected = false,
    onSelect,
    disabled = false,
    ariaLabel,
    showBadgePlaceholder = false,
}: Readonly<ISelectableCardProps>): React.ReactElement {
    const group = use(SelectableCardGroupContext);
    const isSelected = group ? group.value === (value ?? null) : selected;
    const isDisabled = disabled || (group?.disabled ?? false);
    const handleSelect =
        group && value !== undefined ? (): void => group.onChange(value ?? null) : onSelect;

    return (
        <button
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={ariaLabel}
            disabled={isDisabled}
            onClick={handleSelect}
            className={clsx(styles.card, { [styles['m-selected']]: isSelected })}
        >
            {isSelected ? (
                <span className={styles.card__badge}>
                    <SelectionBadge />
                </span>
            ) : (
                showBadgePlaceholder && (
                    <span className={styles['card__badge-placeholder']} aria-hidden="true" />
                )
            )}
            {children}
        </button>
    );
}

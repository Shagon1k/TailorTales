'use client';

import { createContext, use } from 'react';
import clsx from 'clsx';
import styles from './OptionPill.module.scss';

// ── Group context ────────────────────────────────────────────────────────────

interface IOptionPillGroupContext {
    value: string | null;
    onChange: (value: string) => void;
    disabled: boolean;
}

export const OptionPillGroupContext = createContext<IOptionPillGroupContext | null>(null);

// ── Atom ─────────────────────────────────────────────────────────────────────

export interface IOptionPillProps {
    children: React.ReactNode;
    /** Required when used inside OptionPillGroup. */
    value?: string;
    /** Used for standalone (outside a group). */
    selected?: boolean;
    /** Used for standalone (outside a group). */
    onChange?: () => void;
    disabled?: boolean;
}

export default function OptionPill({
    children,
    value,
    selected = false,
    onChange,
    disabled = false,
}: Readonly<IOptionPillProps>): React.ReactElement {
    const group = use(OptionPillGroupContext);

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
            className={clsx(styles['option-pill'], { [styles['m-selected']]: isSelected })}
        >
            {children}
        </button>
    );
}

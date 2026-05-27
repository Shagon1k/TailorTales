'use client';

import { OptionPillGroupContext } from './OptionPill';
import styles from './OptionPillGroup.module.scss';

export interface IOptionPillGroupProps {
    value: string | null;
    onChange: (value: string) => void;
    children: React.ReactNode;
    /** Accessible label for the radio group. */
    label?: string;
    disabled?: boolean;
}

export default function OptionPillGroup({
    value,
    onChange,
    children,
    label,
    disabled = false,
}: Readonly<IOptionPillGroupProps>): React.ReactElement {
    return (
        <OptionPillGroupContext value={{ value, onChange, disabled }}>
            <div role="radiogroup" aria-label={label} className={styles['option-pill-group']}>
                {children}
            </div>
        </OptionPillGroupContext>
    );
}

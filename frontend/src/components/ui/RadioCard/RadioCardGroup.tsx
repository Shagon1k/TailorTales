'use client';

import { RadioCardGroupContext } from './RadioCard';
import styles from './RadioCardGroup.module.scss';

export interface IRadioCardGroupProps {
    value: string | null;
    onChange: (value: string) => void;
    children: React.ReactNode;
    /** Accessible label for the radio group. */
    label?: string;
    disabled?: boolean;
}

export default function RadioCardGroup({
    value,
    onChange,
    children,
    label,
    disabled = false,
}: Readonly<IRadioCardGroupProps>): React.ReactElement {
    return (
        <RadioCardGroupContext value={{ value, onChange, disabled }}>
            <div role="radiogroup" aria-label={label} className={styles['radio-card-group']}>
                {children}
            </div>
        </RadioCardGroupContext>
    );
}

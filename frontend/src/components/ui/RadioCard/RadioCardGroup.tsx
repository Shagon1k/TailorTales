'use client';

import { SelectableCardGroup } from '@/components/ui/SelectableCard/SelectableCard';
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
        <SelectableCardGroup
            value={value}
            onChange={(nextValue) => {
                if (nextValue !== null) onChange(nextValue);
            }}
            label={label}
            disabled={disabled}
        >
            <div className={styles['radio-card-group']}>{children}</div>
        </SelectableCardGroup>
    );
}

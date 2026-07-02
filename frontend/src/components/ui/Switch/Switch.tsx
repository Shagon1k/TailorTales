'use client';

import clsx from 'clsx';
import styles from './Switch.module.scss';

export interface ISwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Visible text beside the switch; also names the control for assistive tech. */
    label: string;
    hideLabel?: boolean;
    disabled?: boolean;
}

/**
 * On/off toggle built on a native checkbox (`role="switch"`) so it stays
 * keyboard- and screen-reader-accessible; the visible track/thumb are styling.
 */
export default function Switch({
    checked,
    onChange,
    label,
    hideLabel = false,
    disabled = false,
}: Readonly<ISwitchProps>): React.ReactElement {
    return (
        <label className={clsx(styles.switch, { [styles['m-disabled']]: disabled })}>
            <input
                type="checkbox"
                role="switch"
                className={styles.switch__input}
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className={styles.switch__track} aria-hidden="true">
                <span className={styles.switch__thumb} />
            </span>
            <span className={clsx(styles.switch__label, { [styles['m-sr-only']]: hideLabel })}>
                {label}
            </span>
        </label>
    );
}

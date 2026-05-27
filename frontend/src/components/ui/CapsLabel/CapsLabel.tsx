import clsx from 'clsx';
import styles from './CapsLabel.module.scss';

export type TCapsLabelVariant = 'default' | 'on-card' | 'gold';

export interface ICapsLabelProps {
    children: React.ReactNode;
    variant?: TCapsLabelVariant;
}

export default function CapsLabel({
    children,
    variant = 'default',
}: Readonly<ICapsLabelProps>): React.ReactElement {
    return (
        <span className={clsx(styles.caps, variant !== 'default' && styles[`m-${variant}`])}>
            {children}
        </span>
    );
}

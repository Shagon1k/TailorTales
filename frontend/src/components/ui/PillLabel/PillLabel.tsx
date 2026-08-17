import styles from './PillLabel.module.scss';

export interface IPillLabelProps {
    children: React.ReactNode;
    mark?: string;
}

export default function PillLabel({
    children,
    mark = '■',
}: Readonly<IPillLabelProps>): React.ReactElement {
    return (
        <span className={styles.pill}>
            <span className={styles.pill__mark} aria-hidden="true">
                {mark}
            </span>
            <span className={styles.pill__text}>{children}</span>
        </span>
    );
}

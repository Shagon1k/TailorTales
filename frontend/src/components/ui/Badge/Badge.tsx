import styles from './Badge.module.scss';

interface IBadgeProps {
    children: React.ReactNode;
}

export default function Badge({ children }: Readonly<IBadgeProps>): React.ReactElement {
    return <span className={styles.badge}>{children}</span>;
}

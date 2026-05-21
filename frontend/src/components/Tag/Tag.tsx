import styles from './Tag.module.css';

interface ITagProps {
    children: React.ReactNode;
}

export default function Tag({ children }: ITagProps): React.ReactElement {
    return <span className={styles.tag}>{children}</span>;
}

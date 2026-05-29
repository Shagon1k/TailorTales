import styles from './SuggestionChip.module.scss';

export interface ISuggestionChipProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
}

export default function SuggestionChip({
    label,
    onClick,
    disabled = false,
}: Readonly<ISuggestionChipProps>): React.ReactElement {
    return (
        <button type="button" disabled={disabled} onClick={onClick} className={styles.chip}>
            <span aria-hidden="true" className={styles.chip__icon}>
                +
            </span>
            {label}
        </button>
    );
}

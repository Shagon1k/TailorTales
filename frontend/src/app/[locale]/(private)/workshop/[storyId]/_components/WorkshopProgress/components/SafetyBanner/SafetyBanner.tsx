import styles from './SafetyBanner.module.scss';

export interface ISafetyBannerProps {
    childName: string;
}

export default function SafetyBanner({
    childName,
}: Readonly<ISafetyBannerProps>): React.ReactElement {
    return (
        <div className={styles.banner}>
            <span aria-hidden="true">🤍</span>
            <span>
                It&apos;s quite safe to close this window — we&apos;ll email{' '}
                <strong>{childName}</strong>&apos;s tale when it&apos;s ready.
            </span>
        </div>
    );
}

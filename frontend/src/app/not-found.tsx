import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './not-found.module.scss';

export default function NotFound(): React.ReactElement {
    return (
        <div className={styles.page}>
            <div aria-hidden="true">
                <MascotImage image="fox-question" size={280} glow="aura" />
            </div>
            <CapsLabel>· 404 ·</CapsLabel>
            <h1 className={styles.heading}>Lost in the woods?</h1>
            <p className={styles.sub}>This page doesn&apos;t exist — but your next story does.</p>
            <ButtonLink href="/">Take me home</ButtonLink>
        </div>
    );
}

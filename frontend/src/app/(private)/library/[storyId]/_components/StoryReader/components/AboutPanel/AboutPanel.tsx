import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Button from '@/components/ui/Button/Button';
import styles from './AboutPanel.module.scss';

export interface IAboutPanelProps {
    /** Regenerations remaining for this user this month. Phase 7: wire from subscription API. */
    regenerationsLeft?: number;
}

export default function AboutPanel({
    regenerationsLeft,
}: Readonly<IAboutPanelProps>): React.ReactElement {
    return (
        <section className={styles.about} aria-labelledby="about-heading">
            <div className={styles.about__header}>
                <CapsLabel>· About this page ·</CapsLabel>
            </div>

            {/* Phase 7 — wire AI narrative note and regeneration actions */}
            <p id="about-heading" className={styles.about__placeholder}>
                Context and regeneration controls will appear here once your tale is generated.
            </p>

            <div className={styles.about__actions}>
                {/* Disabled until Phase 7 wires the regeneration API */}
                <Button variant="secondary" disabled>
                    + Regenerate words on this page
                </Button>
                <Button variant="secondary" disabled>
                    + Repaint the picture
                </Button>
            </div>

            {regenerationsLeft !== undefined && (
                <p className={styles.about__quota}>
                    {`${regenerationsLeft} regenerations left this month`}
                </p>
            )}
        </section>
    );
}

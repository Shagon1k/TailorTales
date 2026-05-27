import ButtonLink from '@/components/ui/Button/ButtonLink';
import styles from './CtaSection.module.scss';

export default function CtaSection(): React.ReactElement {
    return (
        <section className={styles.cta}>
            <div className={styles.cta__card}>
                <span className={styles.cta__dot} aria-hidden="true">
                    ♥
                </span>
                <h2 className={styles.cta__heading}>One small tale, tonight.</h2>
                <p className={styles.cta__sub}>
                    Free first chapter. No card, no clock. Just a name, a question, and ten quiet
                    minutes.
                </p>
                <ButtonLink href="/sign-up">Begin a tale for free →</ButtonLink>
            </div>
        </section>
    );
}

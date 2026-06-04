import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Card from '@/components/ui/Card/Card';
import styles from './LanternsSection.module.scss';

const STEPS = [
    {
        numeral: 'i.',
        title: 'Light a name',
        body: 'Tell us who the story is for. Just a name, an age, a few things they love.',
    },
    {
        numeral: 'ii.',
        title: 'Whisper a why',
        body: 'Pick a question they keep asking. Or one of ours. The tale is built around it.',
    },
    {
        numeral: 'iii.',
        title: 'Carry it home',
        body: 'A printable PDF in minutes. Five to twenty pages, age-fit, theirs to keep.',
    },
] as const;

export default function LanternsSection(): React.ReactElement {
    return (
        <section className={styles.lanterns}>
            <div className={styles.lanterns__inner}>
                <div className={styles.lanterns__header}>
                    <CapsLabel variant="gold">· How the workshop works ·</CapsLabel>
                    <h2 className={styles.lanterns__heading}>Three lanterns, then a book.</h2>
                </div>
                <div className={styles.lanterns__grid}>
                    {STEPS.map(({ numeral, title, body }) => (
                        <Card key={numeral} variant="dark" size="lg">
                            <span className={styles.lanterns__numeral}>{numeral}</span>
                            <strong className={styles.lanterns__title}>{title}</strong>
                            <p className={styles.lanterns__body}>{body}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

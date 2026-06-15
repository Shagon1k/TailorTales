import Card from '@/components/ui/Card/Card';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './DetailedStepsSection.module.scss';

const STEPS = [
    {
        numeral: 'i.',
        title: 'Light a name',
        body: 'Tell us who the story is for — a first name, an age, and two or three things they love right now. Dinosaurs, puddles, their dog. We use that to anchor the tale in their world, not a generic one.',
        details: [
            'Takes about a minute',
            'One child per tale',
            'You can save profiles for next time',
        ],
    },
    {
        numeral: 'ii.',
        title: 'Whisper a why',
        body: "Pick the question or theme that's been on their mind lately. Why is the sky dark? Where do lost things go? Choose from our curated list or type your own. The tale is built around that spark, not around a generic plot.",
        details: [
            '40+ starter questions',
            'Or write your own in plain words',
            'Tone adjusts to age automatically',
        ],
    },
    {
        numeral: 'iii.',
        title: 'Carry it home',
        body: 'In a few minutes, a printable PDF lands in your library. Five to twenty pages — the length fits the age. A picture book for four-year-olds, a longer comic for eight-year-olds. Theirs to keep, re-read, and print.',
        details: [
            'PDF ready in under 5 minutes',
            'Book or comic format',
            'Print at home or at any copy shop',
        ],
    },
] as const;

export default function DetailedStepsSection(): React.ReactElement {
    return (
        <section className={styles.steps}>
            <div className={styles.steps__mascot}>
                <MascotImage image="fox-map" size={140} glow="outline" />
            </div>
            <div className={styles.steps__list}>
                {STEPS.map(({ numeral, title, body, details }) => (
                    <Card key={numeral} variant="dark" size="lg">
                        <div className={styles.step}>
                            <span className={styles.step__numeral}>{numeral}</span>
                            <div className={styles.step__content}>
                                <strong className={styles.step__title}>{title}</strong>
                                <p className={styles.step__body}>{body}</p>
                                <ul className={styles.step__details}>
                                    {details.map((d) => (
                                        <li key={d} className={styles['step__detail-item']}>
                                            <span aria-hidden="true">·</span> {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
}

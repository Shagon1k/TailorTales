import { getTranslations } from 'next-intl/server';
import Card from '@/components/ui/Card/Card';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './DetailedStepsSection.module.scss';

export default async function DetailedStepsSection(): Promise<React.ReactElement> {
    const t = await getTranslations('howItWorks.steps');

    const steps = [
        {
            numeral: t('lightAName.numeral'),
            title: t('lightAName.title'),
            body: t('lightAName.body'),
            details: [t('lightAName.detail1'), t('lightAName.detail2'), t('lightAName.detail3')],
        },
        {
            numeral: t('whisperAWhy.numeral'),
            title: t('whisperAWhy.title'),
            body: t('whisperAWhy.body'),
            details: [t('whisperAWhy.detail1'), t('whisperAWhy.detail2'), t('whisperAWhy.detail3')],
        },
        {
            numeral: t('carryItHome.numeral'),
            title: t('carryItHome.title'),
            body: t('carryItHome.body'),
            details: [t('carryItHome.detail1'), t('carryItHome.detail2'), t('carryItHome.detail3')],
        },
    ];

    return (
        <section className={styles.steps}>
            <div className={styles.steps__mascot}>
                <MascotImage image="fox-map" size={140} glow="outline" />
            </div>
            <div className={styles.steps__list}>
                {steps.map(({ numeral, title, body, details }) => (
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

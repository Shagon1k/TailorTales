import { getTranslations } from 'next-intl/server';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import Card from '@/components/ui/Card/Card';
import styles from './LanternsSection.module.scss';

export default async function LanternsSection(): Promise<React.ReactElement> {
    const t = await getTranslations('home.lanterns');

    const steps = [
        {
            numeral: t('lightAName.numeral'),
            title: t('lightAName.title'),
            body: t('lightAName.body'),
        },
        {
            numeral: t('whisperAWhy.numeral'),
            title: t('whisperAWhy.title'),
            body: t('whisperAWhy.body'),
        },
        {
            numeral: t('carryItHome.numeral'),
            title: t('carryItHome.title'),
            body: t('carryItHome.body'),
        },
    ];

    return (
        <section className={styles.lanterns}>
            <div className={styles.lanterns__inner}>
                <div className={styles.lanterns__header}>
                    <CapsLabel variant="gold">{t('label')}</CapsLabel>
                    <h2 className={styles.lanterns__heading}>{t('heading')}</h2>
                </div>
                <div className={styles.lanterns__grid}>
                    {steps.map(({ numeral, title, body }) => (
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

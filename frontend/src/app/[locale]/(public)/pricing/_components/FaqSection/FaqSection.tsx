import { getTranslations } from 'next-intl/server';
import styles from './FaqSection.module.scss';

export default async function FaqSection(): Promise<React.ReactElement> {
    const t = await getTranslations('pricing.faq');

    const items = [
        { q: t('cancelAnyTime.question'), a: t('cancelAnyTime.answer') },
        { q: t('unusedCredits.question'), a: t('unusedCredits.answer') },
        { q: t('contentSafety.question'), a: t('contentSafety.answer') },
        { q: t('childData.question'), a: t('childData.answer') },
        { q: t('giftingTale.question'), a: t('giftingTale.answer') },
        { q: t('languages.question'), a: t('languages.answer') },
    ];

    return (
        <section className={styles.faq}>
            <h2 className={styles.faq__heading}>{t('heading')}</h2>
            <div className={styles.faq__grid}>
                {items.map(({ q, a }) => (
                    <div key={q} className={styles.faq__card}>
                        <h3 className={styles.faq__question}>{q}</h3>
                        <p className={styles.faq__answer}>{a}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}

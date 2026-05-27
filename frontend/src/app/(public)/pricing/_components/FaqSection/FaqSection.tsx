import Card from '@/components/ui/Card/Card';
import type { IFaqItem } from '../types';
import styles from './FaqSection.module.scss';

interface IFaqSectionProps {
    items: IFaqItem[];
}

export default function FaqSection({ items }: Readonly<IFaqSectionProps>): React.ReactElement {
    return (
        <section className={styles.faq}>
            <h2 className={styles.faq__heading}>Small questions, gently answered.</h2>
            <div className={styles.faq__grid}>
                {items.map(({ q, a }) => (
                    <Card key={q} variant="outlined" size="lg">
                        <div className={styles.faq__content}>
                            <h3 className={styles.faq__question}>{q}</h3>
                            <p className={styles.faq__answer}>{a}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </section>
    );
}

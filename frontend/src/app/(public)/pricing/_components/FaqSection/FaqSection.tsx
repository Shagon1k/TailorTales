import type { IFaqItem } from '../types';
import styles from './FaqSection.module.scss';

interface IFaqSectionProps {
    items: IFaqItem[];
}

export default function FaqSection({ items }: Readonly<IFaqSectionProps>): React.ReactElement {
    return (
        <section className={styles.faq}>
            <h2 className={styles.faq__heading}>A few things worth knowing.</h2>
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

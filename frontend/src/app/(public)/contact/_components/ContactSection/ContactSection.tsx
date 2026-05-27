import ContactForm from './ContactForm/ContactForm';
import styles from './ContactSection.module.scss';

interface IContactSectionProps {
    email: string;
}

export default function ContactSection({ email }: Readonly<IContactSectionProps>): React.ReactElement {
    return (
        <section className={styles.section}>
            <div className={styles.section__inner}>
                <div className={styles.section__info}>
                    <h2 className={styles.info__heading}>Drop us a line</h2>
                    <p className={styles.info__body}>
                        We&apos;re a small team, so replies may take a day or two.
                        We always write back.
                    </p>
                    <a href={`mailto:${email}`} className={styles.info__email}>
                        {email}
                    </a>
                </div>
                <ContactForm />
            </div>
        </section>
    );
}

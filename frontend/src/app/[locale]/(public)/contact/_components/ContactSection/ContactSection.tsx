import { getTranslations } from 'next-intl/server';
import ContactForm from './ContactForm/ContactForm';
import styles from './ContactSection.module.scss';

interface IContactSectionProps {
    email: string;
}

export default async function ContactSection({
    email,
}: Readonly<IContactSectionProps>): Promise<React.ReactElement> {
    const t = await getTranslations('contact.section');

    return (
        <section className={styles.section}>
            <div className={styles.section__inner}>
                <div className={styles.section__info}>
                    <h2 className={styles.info__heading}>{t('heading')}</h2>
                    <p className={styles.info__body}>{t('body')}</p>
                    <a href={`mailto:${email}`} className={styles.info__email}>
                        {email}
                    </a>
                </div>
                <ContactForm />
            </div>
        </section>
    );
}

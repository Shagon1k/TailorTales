import { getTranslations } from 'next-intl/server';
import styles from './PrivacyContent.module.scss';

export default async function PrivacyContent(): Promise<React.ReactElement> {
    const t = await getTranslations('privacy');

    const sections = [
        { title: t('whatWeCollect.title'), body: t('whatWeCollect.body') },
        { title: t('howWeUseIt.title'), body: t('howWeUseIt.body') },
        { title: t('whoWeShareWith.title'), body: t('whoWeShareWith.body') },
        { title: t('yourRights.title'), body: t('yourRights.body') },
        { title: t('cookies.title'), body: t('cookies.body') },
    ];

    return (
        <article className={styles.content}>
            {sections.map(({ title, body }) => (
                <section key={title} className={styles.section}>
                    <h2 className={styles.section__title}>{title}</h2>
                    <p className={styles.section__body}>{body}</p>
                </section>
            ))}
            <p className={styles.content__updated}>{t('lastUpdated')}</p>
        </article>
    );
}

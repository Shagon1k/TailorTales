import { getTranslations } from 'next-intl/server';
import { getServerUser } from '@/api/user.server';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import styles from './CtaSection.module.scss';

export default async function CtaSection(): Promise<React.ReactElement | null> {
    // Redundant for signed-in users — the "begin a free tale" prompt only makes sense logged out.
    const [user, t] = await Promise.all([getServerUser(), getTranslations('home.cta')]);
    if (user) return null;

    return (
        <section className={styles.cta}>
            <div className={styles.cta__card}>
                <h2 className={styles.cta__heading}>{t('heading')}</h2>
                <p className={styles.cta__sub}>{t('subheading')}</p>
                <ButtonLink href="/login">{t('button')}</ButtonLink>
            </div>
        </section>
    );
}

import { getTranslations } from 'next-intl/server';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './not-found.module.scss';

export default async function NotFound(): Promise<React.ReactElement> {
    const t = await getTranslations('notFound');

    return (
        <div className={styles.page}>
            <div aria-hidden="true">
                <MascotImage image="fox-question" size={280} glow="aura" />
            </div>
            <CapsLabel>{t('eyebrow')}</CapsLabel>
            <h1 className={styles.heading}>{t('heading')}</h1>
            <p className={styles.sub}>{t('subheading')}</p>
            <ButtonLink href="/">{t('homeLink')}</ButtonLink>
        </div>
    );
}

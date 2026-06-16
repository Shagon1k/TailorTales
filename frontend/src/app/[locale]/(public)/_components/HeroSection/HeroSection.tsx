import { getTranslations } from 'next-intl/server';
import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './HeroSection.module.scss';

interface IHeroSectionProps {
    isLoggedIn: boolean;
}

export default async function HeroSection({
    isLoggedIn,
}: Readonly<IHeroSectionProps>): Promise<React.ReactElement> {
    const t = await getTranslations('home.hero');

    return (
        <PageHero
            eyebrow={t('eyebrow')}
            heading={t.rich('heading', {
                highlight: (chunks) => <HeroHighlight>{chunks}</HeroHighlight>,
            })}
            sub={t('subheading')}
        >
            <div className={styles.hero__actions}>
                {isLoggedIn ? (
                    <ButtonLink href="/workshop">{t('cta.loggedIn')}</ButtonLink>
                ) : (
                    <>
                        <ButtonLink href="/login">{t('cta.signUp')}</ButtonLink>
                        <ButtonLink href="/how-it-works" variant="secondary">
                            {t('cta.howItWorksButton')}
                        </ButtonLink>
                    </>
                )}
            </div>
            <div className={styles.hero__visual} aria-hidden="true">
                <MascotImage image="fox-hero" size={280} glow="aura" />
            </div>
        </PageHero>
    );
}

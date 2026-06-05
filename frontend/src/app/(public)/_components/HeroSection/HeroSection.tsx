import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './HeroSection.module.scss';

interface IHeroSectionProps {
    isLoggedIn: boolean;
}

export default function HeroSection({
    isLoggedIn,
}: Readonly<IHeroSectionProps>): React.ReactElement {
    return (
        <PageHero
            eyebrow="A small light at bedtime"
            heading={
                <>
                    Where their <HeroHighlight>questions</HeroHighlight>
                    <br />
                    become their <HeroHighlight>stories</HeroHighlight>.
                </>
            }
            sub="A small workshop that takes your child's name, age and curiosity, and stitches them into a tiny book or comic — five to twenty pages, theirs to keep forever."
        >
            <div className={styles.hero__actions}>
                {isLoggedIn ? (
                    <ButtonLink href="/workshop">Open workshop →</ButtonLink>
                ) : (
                    <>
                        <ButtonLink href="/login">Begin your first tale →</ButtonLink>
                        <ButtonLink href="/how-it-works" variant="secondary">
                            How it works
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

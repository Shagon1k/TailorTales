import PageHero, { HeroHighlight } from '@/components/shared/PageHero/PageHero';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import MascotImage from '@/components/shared/MascotImage/MascotImage';
import styles from './HeroSection.module.scss';

export default function HeroSection(): React.ReactElement {
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
            sub="A small workshop that takes your child's name, age and curiosity, and stitches them into a tiny book or comic — five to twenty pages, glowing on the page, theirs forever."
        >
            <div className={styles.hero__actions}>
                <ButtonLink href="/login">Light the first lantern →</ButtonLink>
                <ButtonLink href="/how-it-works" variant="secondary">
                    Hear the workshop
                </ButtonLink>
            </div>
            <div className={styles.hero__visual} aria-hidden="true">
                <MascotImage image="fox-hero" size={280} glow="aura" />
            </div>
        </PageHero>
    );
}

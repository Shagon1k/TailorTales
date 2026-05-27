import Image from 'next/image';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import styles from './HeroSection.module.scss';

export default function HeroSection(): React.ReactElement {
    return (
        <section className={styles.hero}>
            <div className={styles.hero__inner}>
                <CapsLabel>· A small light at bedtime ·</CapsLabel>
                <h1 className={styles.hero__headline}>
                    Where their <em className={styles['hero__accent']}>questions</em>
                    <br />
                    become their <em className={styles['hero__accent']}>stories</em>.
                </h1>
                <p className={styles.hero__sub}>
                    A small workshop that takes your child&apos;s name, age and curiosity,
                    and stitches them into a tiny book or comic — five to twenty
                    pages, glowing on the page, theirs forever.
                </p>
                <div className={styles.hero__actions}>
                    <ButtonLink href="/sign-up">
                        Light the first lantern →
                    </ButtonLink>
                    <ButtonLink href="/how-it-works" variant="secondary">
                        Hear the workshop
                    </ButtonLink>
                </div>
            </div>
            <div className={styles.hero__visual} aria-hidden="true">
                <div className={styles.hero__glow} />
                <Image
                    src="/images/fox-hero.webp"
                    alt=""
                    width={320}
                    height={320}
                    priority
                    className={styles.hero__fox}
                />
            </div>
        </section>
    );
}

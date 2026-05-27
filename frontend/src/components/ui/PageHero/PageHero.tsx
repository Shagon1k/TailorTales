import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './PageHero.module.scss';

interface IPageHeroProps {
    eyebrow?: string;
    heading: string;
    sub?: string;
}

export default function PageHero({
    eyebrow,
    heading,
    sub,
}: Readonly<IPageHeroProps>): React.ReactElement {
    return (
        <section className={styles.hero}>
            {eyebrow && <CapsLabel>{eyebrow}</CapsLabel>}
            <h1 className={styles.hero__heading}>{heading}</h1>
            {sub && <p className={styles.hero__sub}>{sub}</p>}
        </section>
    );
}

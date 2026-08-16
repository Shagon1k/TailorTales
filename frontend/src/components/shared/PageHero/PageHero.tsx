import PillLabel from '@/components/ui/PillLabel/PillLabel';
import styles from './PageHero.module.scss';

interface IPageHeroProps {
    /** Eyebrow text, rendered with the default PillLabel diamond mark. */
    eyebrow?: string;
    /** Heading content. Wrap emphasized words in <HeroHighlight> for the orange italic accent. */
    heading: React.ReactNode;
    sub?: string;
    /** Extra content below the sub (e.g. actions, illustration). */
    children?: React.ReactNode;
}

/** Orange italic accent for emphasized words inside a PageHero heading. */
export function HeroHighlight({
    children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
    return <em className={styles.highlight}>{children}</em>;
}

export default function PageHero({
    eyebrow,
    heading,
    sub,
    children,
}: Readonly<IPageHeroProps>): React.ReactElement {
    return (
        <section className={styles.hero}>
            {eyebrow && <PillLabel>{eyebrow}</PillLabel>}
            <h1 className={styles.hero__heading}>{heading}</h1>
            {sub && <p className={styles.hero__sub}>{sub}</p>}
            {children}
        </section>
    );
}

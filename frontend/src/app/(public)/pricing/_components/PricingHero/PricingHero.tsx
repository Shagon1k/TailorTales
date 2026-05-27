import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import styles from './PricingHero.module.scss';

export default function PricingHero(): React.ReactElement {
    return (
        <section className={styles.hero}>
            <CapsLabel>· Pay per tale or join the Story Hour ·</CapsLabel>
            <h1 className={styles.hero__heading}>
                Pricing as quiet
                <br />
                as the rest of us.
            </h1>
            <p className={styles.hero__sub}>
                Tales are sold by the page, or in a small monthly bundle. No tricks, no per-book
                add-ons, no hidden seats. Cancel any time — your shelf stays yours.
            </p>
        </section>
    );
}

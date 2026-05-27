import Card from '@/components/ui/Card/Card';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import CapsLabel from '@/components/ui/CapsLabel/CapsLabel';
import type { IPricingPlan } from '../../../types';
import styles from './PriceCard.module.scss';

interface IPriceCardProps {
    plan: IPricingPlan;
    billingCycle: 'monthly' | 'yearly';
}

function formatPrice(priceMonthly: number, cycle: 'monthly' | 'yearly'): string {
    if (priceMonthly === 0) return '€0';
    const price = cycle === 'yearly'
        ? Math.round(priceMonthly * 0.8 * 10) / 10
        : priceMonthly;
    return `€${price}`;
}

export default function PriceCard({ plan, billingCycle }: Readonly<IPriceCardProps>): React.ReactElement {
    const { name, tagline, priceMonthly, features, ctaLabel, ctaHref, mostLoved } = plan;
    const isFree = priceMonthly === 0;

    return (
        <Card variant={mostLoved ? 'gradient' : 'outlined'} size="hero">
            {mostLoved && (
                <div className={styles.badge}>
                    <CapsLabel variant="on-card">Most loved</CapsLabel>
                </div>
            )}
            <div className={styles.body}>
                <div className={styles.header}>
                    <h3 className={styles.name}>{name}</h3>
                    <p className={styles.tagline}>{tagline}</p>
                </div>
                <div className={styles.price}>
                    <span className={styles['price-amount']}>
                        {formatPrice(priceMonthly, billingCycle)}
                    </span>
                    <span className={styles['price-period']}>
                        {isFree ? 'forever' : '/ month'}
                    </span>
                </div>
                <ul className={styles.features}>
                    {features.map((f) => (
                        <li key={f} className={styles.feature}>
                            <span className={styles['feature-plus']} aria-hidden="true">+</span>
                            {f}
                        </li>
                    ))}
                </ul>
                <ButtonLink href={ctaHref} variant={mostLoved ? 'primary' : 'secondary'}>
                    {ctaLabel}
                </ButtonLink>
            </div>
        </Card>
    );
}

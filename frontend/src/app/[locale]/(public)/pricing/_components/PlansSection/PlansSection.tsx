import { getTranslations } from 'next-intl/server';
import type { IPricingPlan } from '../types';
import PriceCard from './components/PriceCard/PriceCard';
import styles from './PlansSection.module.scss';

interface IPlansectionProps {
    plans: IPricingPlan[];
}

export default async function PlansSection({
    plans,
}: Readonly<IPlansectionProps>): Promise<React.ReactElement> {
    const t = await getTranslations('pricing.plans');

    return (
        <section className={styles.plans}>
            <div className={styles.plans__grid}>
                {plans.map((plan) => (
                    <PriceCard key={plan.id} plan={plan} />
                ))}
            </div>
            <p className={styles.plans__note}>{t('creditNote')}</p>
        </section>
    );
}

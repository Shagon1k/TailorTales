import type { IPricingPlan } from '../types';
import PriceCard from './components/PriceCard/PriceCard';
import styles from './PlansSection.module.scss';

interface IPlansectionProps {
    plans: IPricingPlan[];
}

export default function PlansSection({ plans }: Readonly<IPlansectionProps>): React.ReactElement {
    return (
        <section className={styles.plans}>
            <div className={styles.plans__grid}>
                {plans.map((plan) => (
                    <PriceCard key={plan.id} plan={plan} />
                ))}
            </div>
            <p className={styles.plans__note}>
                Page credits: 1 book page = 1 credit · 1 comic page = 2 credits.
            </p>
        </section>
    );
}

'use client';

import { useState } from 'react';
import type { IPricingPlan } from '../types';
import PriceCard from './components/PriceCard/PriceCard';
import styles from './PlansSection.module.scss';

type TBillingCycle = 'monthly' | 'yearly';

interface IPlansectionProps {
    plans: IPricingPlan[];
}

export default function PlansSection({ plans }: Readonly<IPlansectionProps>): React.ReactElement {
    const [cycle, setCycle] = useState<TBillingCycle>('monthly');

    return (
        <section className={styles.plans}>
            <div className={styles.plans__toggle} role="group" aria-label="Billing cycle">
                <button
                    className={styles['plans__toggle-btn']}
                    data-active={cycle === 'monthly'}
                    onClick={() => setCycle('monthly')}
                    aria-pressed={cycle === 'monthly'}
                >
                    Monthly
                </button>
                <button
                    className={styles['plans__toggle-btn']}
                    data-active={cycle === 'yearly'}
                    onClick={() => setCycle('yearly')}
                    aria-pressed={cycle === 'yearly'}
                >
                    Yearly · save 20%
                </button>
            </div>
            <div className={styles.plans__grid}>
                {plans.map((plan) => (
                    <PriceCard key={plan.id} plan={plan} billingCycle={cycle} />
                ))}
            </div>
            <p className={styles.plans__note}>
                Page credits: 1 book page = 1 credit · 1 comic page = 2 credits.
                Unused credits roll one month forward.
            </p>
        </section>
    );
}

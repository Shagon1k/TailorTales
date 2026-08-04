'use client';

import { useLocale, useTranslations } from 'next-intl';
import Card from '@/components/ui/Card/Card';
import Button from '@/components/ui/Button/Button';
import ButtonLink from '@/components/ui/Button/ButtonLink';
import { useCurrentUser } from '@/context/UserContext';
import { useSubscription } from '@/hooks/subscription';
import { getPaddle, PADDLE_CHECKOUT_SETTINGS } from '@/lib/paddle';
import { ANALYTICS_EVENTS, useTrackAnalytics } from '@/lib/analytics';
import { formatMoney } from '@/utils/money.utils';
import type { IPricingPlan } from '../../../types';
import styles from './PriceCard.module.scss';

interface IPriceCardProps {
    plan: IPricingPlan;
}

export default function PriceCard({ plan }: Readonly<IPriceCardProps>): React.ReactElement {
    const { name, tagline, priceMonthly, features, ctaLabel, paddlePriceId, mostLoved } = plan;
    const isFree = priceMonthly === 0;
    const buttonVariant = mostLoved ? 'primary' : 'secondary';
    const t = useTranslations('pricing.plans');
    const locale = useLocale();

    const { user } = useCurrentUser();
    const { data: subscription } = useSubscription();
    const { track } = useTrackAnalytics();

    const openCheckout = async (): Promise<void> => {
        if (!user || !paddlePriceId) return;
        const paddle = await getPaddle({ email: user.email });
        if (!paddle) return;

        track({
            name: ANALYTICS_EVENTS.beginCheckout,
            parameters: {
                currency: 'EUR',
                value: priceMonthly / 100,
                plan_id: plan.id,
            },
        });

        paddle.Checkout.open({
            items: [{ priceId: paddlePriceId, quantity: 1 }],
            customData: { userId: user.id },
            customer: { email: user.email },
            settings: {
                ...PADDLE_CHECKOUT_SETTINGS,
                locale,
                successUrl: `${window.location.origin}/account/subscription?checkout=success&plan=${encodeURIComponent(plan.id)}`,
            },
        });
    };

    const renderCta = (): React.ReactElement => {
        // Unauthenticated — every road starts at sign-in
        if (!user) {
            return (
                <ButtonLink href="/login" variant={buttonVariant}>
                    {ctaLabel}
                </ButtonLink>
            );
        }

        const isCurrentPlan = subscription?.tier.id === plan.id;
        if (isCurrentPlan) {
            return (
                <Button variant={buttonVariant} disabled>
                    {t('currentPlan')}
                </Button>
            );
        }

        // Paid subscribers change plans via the Paddle portal in account settings
        const hasPaidSubscription =
            subscription !== undefined && subscription.tier.priceMonthly > 0;
        if (hasPaidSubscription || isFree) {
            return (
                <ButtonLink href="/account/subscription" variant={buttonVariant}>
                    {t('manageInAccount')}
                </ButtonLink>
            );
        }

        // Free-tier user upgrading — overlay checkout (disabled until Paddle is configured)
        const checkoutAvailable = Boolean(
            paddlePriceId && process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        );
        return (
            <Button
                variant={buttonVariant}
                disabled={!checkoutAvailable}
                onClick={() => openCheckout()}
            >
                {checkoutAvailable ? ctaLabel : t('checkoutSoon')}
            </Button>
        );
    };

    return (
        <Card variant={mostLoved ? 'featured' : 'dark'} size="hero">
            {mostLoved && (
                <div className={styles.badge}>
                    <span className={styles['badge-pill']}>{t('mostLoved')}</span>
                </div>
            )}
            <div className={styles.body}>
                <div className={styles.header}>
                    <h3 className={styles.name}>{name}</h3>
                    <p className={styles.tagline}>{tagline}</p>
                </div>
                <div className={styles.price}>
                    <span className={styles['price-amount']}>{formatMoney(priceMonthly)}</span>
                    <span className={styles['price-period']}>
                        {isFree ? t('priceForever') : t('pricePerMonth')}
                    </span>
                </div>
                <ul className={styles.features}>
                    {features.map((f) => (
                        <li key={f} className={styles.feature}>
                            <span className={styles['feature-plus']} aria-hidden="true">
                                +
                            </span>
                            {f}
                        </li>
                    ))}
                </ul>
                {renderCta()}
            </div>
        </Card>
    );
}

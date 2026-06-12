import { initializePaddle, type CheckoutSettings, type Paddle } from '@paddle/paddle-js';

/**
 * Product-wide overlay checkout policy. Callers spread this into
 * Paddle.Checkout.open() settings and add runtime values (successUrl).
 */
export const PADDLE_CHECKOUT_SETTINGS: CheckoutSettings = {
    theme: 'dark',
    allowLogout: false, // email comes from the signed-in account — changing it would bind the Paddle customer to a different address
    showAddTaxId: false,
    showAddDiscounts: false, // no discount codes exist yet
};

let paddlePromise: Promise<Paddle | undefined> | null = null;

/**
 * Lazily initializes Paddle.js (overlay checkout). Returns undefined when
 * NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not configured — callers degrade
 * gracefully (e.g. keep the CTA pointing at /pricing docs instead of crashing).
 */
export function getPaddle(): Promise<Paddle | undefined> {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return Promise.resolve(undefined);

    paddlePromise ??= initializePaddle({
        token,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
    });

    return paddlePromise;
}

import {
    initializePaddle,
    type CheckoutSettings,
    type Paddle,
    type PaddleSetupPwCustomer,
} from '@paddle/paddle-js';

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
 * Lazily initializes Paddle.js. A known customer email is also passed to
 * Paddle's transaction recovery flow, which is used by payment links.
 */
export async function getPaddle(pwCustomer?: PaddleSetupPwCustomer): Promise<Paddle | undefined> {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return undefined;

    paddlePromise ??= initializePaddle({
        token,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? 'production' : 'sandbox',
        pwCustomer,
    });

    try {
        const paddle = await paddlePromise;
        if (paddle && pwCustomer) {
            paddle.Update({ pwCustomer });
        }
        return paddle;
    } catch (error: unknown) {
        paddlePromise = null;
        console.error('Paddle initialization failed', error);
        throw error;
    }
}

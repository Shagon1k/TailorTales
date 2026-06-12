export const PADDLE_CLIENT = Symbol('PADDLE_CLIENT');

/**
 * The subset of a Paddle webhook event the handlers consume. The real client
 * maps the SDK's unmarshalled event onto this shape; the stub parses raw JSON
 * fixtures of the same shape (Paddle's own payload field names).
 */
export interface IPaddleEvent {
    eventType: string;
    data: {
        /** Subscription id (`sub_…`) on subscription.* events; transaction id (`txn_…`) on transaction.* events. */
        id: string;
        /** Present on transaction.* events — the subscription the transaction belongs to. */
        subscriptionId?: string | null;
        customerId?: string;
        status?: string;
        customData?: { userId?: string } | null;
        items?: Array<{ price?: { id?: string } }>;
        currentBillingPeriod?: { endsAt?: string } | null;
        scheduledChange?: { action?: string } | null;
    };
}

export interface IInvoice {
    date: string;
    description: string;
    /** Total in the smallest currency unit (cents). */
    amount: number;
    currency: string;
    status: string;
    invoicePdfUrl: string | null;
}

export interface IPaddleClient {
    /** Verifies the webhook signature and returns the parsed event. Throws on a bad signature. */
    verifyAndParseWebhook(rawBody: Buffer, signature: string): Promise<IPaddleEvent>;
    /** Schedules cancellation at the end of the current billing period. */
    cancelSubscription(paddleSubscriptionId: string): Promise<void>;
    /** Returns the customer's Paddle-hosted billing portal URL. */
    createPortalSession(paddleCustomerId: string): Promise<{ url: string }>;
    listInvoices(paddleCustomerId: string): Promise<IInvoice[]>;
}

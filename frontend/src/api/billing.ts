import { apiFetch } from '@/lib/api';
import type { IInvoice } from '@/types/subscription.types';

export const billingApi = {
    /** Schedules cancellation at the end of the current billing period. */
    cancel: (): Promise<{ scheduled: boolean }> =>
        apiFetch<{ scheduled: boolean }>('/billing/cancel', { method: 'POST' }),

    /** Paddle-hosted billing portal (payment method / plan change). */
    createPortalSession: (): Promise<{ url: string }> =>
        apiFetch<{ url: string }>('/billing/portal', { method: 'POST' }),

    sync: (): Promise<{ synced: boolean }> =>
        apiFetch<{ synced: boolean }>('/billing/sync', { method: 'POST' }),

    getInvoices: (): Promise<IInvoice[]> => apiFetch<IInvoice[]>('/billing/invoices'),
};

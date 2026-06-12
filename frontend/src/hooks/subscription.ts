import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/api/billing';
import { subscriptionApi } from '@/api/subscription';
import { useCurrentUser } from '@/context/UserContext';
import type { IInvoice, IUsageSummary } from '@/types/subscription.types';

export const SUBSCRIPTION_QUERY_KEY = ['subscription'] as const;
export const INVOICES_QUERY_KEY = ['billing', 'invoices'] as const;

export function useSubscription(): ReturnType<typeof useQuery<IUsageSummary>> {
    const { user } = useCurrentUser();
    return useQuery({
        queryKey: SUBSCRIPTION_QUERY_KEY,
        queryFn: () => subscriptionApi.getMine(),
        enabled: Boolean(user),
    });
}

export function useInvoices(): ReturnType<typeof useQuery<IInvoice[]>> {
    return useQuery({ queryKey: INVOICES_QUERY_KEY, queryFn: () => billingApi.getInvoices() });
}

export function useCancelSubscription(): ReturnType<
    typeof useMutation<{ scheduled: boolean }, Error, void>
> {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => billingApi.cancel(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_QUERY_KEY }),
    });
}

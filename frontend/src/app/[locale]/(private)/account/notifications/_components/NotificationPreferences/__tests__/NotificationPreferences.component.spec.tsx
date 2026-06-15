import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { INotificationPreferences } from '@/types/notification.types';
import NotificationPreferences from '../NotificationPreferences';

const mockGetPreferences = vi.hoisted(() => vi.fn());
const mockUpdatePreferences = vi.hoisted(() => vi.fn());

vi.mock('@/api/notifications', () => ({
    notificationsApi: {
        getPreferences: mockGetPreferences,
        updatePreferences: mockUpdatePreferences,
    },
}));

const ALL_ON: INotificationPreferences = {
    storyCompleted: { email: true, inApp: true },
    storyFailed: { email: true, inApp: true },
    paymentFailed: { inApp: true },
    subscriptionCanceled: { email: true, inApp: true },
    subscriptionRenewed: { email: true },
};

function renderPrefs(): void {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
        <MantineProvider>
            <QueryClientProvider client={queryClient}>
                <NotificationPreferences />
            </QueryClientProvider>
        </MantineProvider>,
    );
}

describe('NotificationPreferences', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetPreferences.mockResolvedValue(ALL_ON);
        mockUpdatePreferences.mockResolvedValue(ALL_ON);
    });

    describe('rendering', () => {
        it('should show a row per event with its channel switches', async () => {
            renderPrefs();

            const readyRow = (await screen.findByText('Tale is ready')).closest('li');
            expect(readyRow).not.toBeNull();
            expect(within(readyRow!).getByRole('switch', { name: 'Email' })).toBeChecked();
            expect(within(readyRow!).getByRole('switch', { name: 'In-app' })).toBeChecked();
        });

        it('should not offer an email toggle for payment failures', async () => {
            renderPrefs();

            const paymentRow = (await screen.findByText('Payment failed')).closest('li');
            expect(within(paymentRow!).queryByRole('switch', { name: 'Email' })).toBeNull();
            expect(within(paymentRow!).getByRole('switch', { name: 'In-app' })).toBeInTheDocument();
            expect(within(paymentRow!).getByText(/always sent/i)).toBeInTheDocument();
        });

        it('should only offer an email toggle for plan renewals', async () => {
            renderPrefs();

            const renewedRow = (await screen.findByText('Plan renewed')).closest('li');
            expect(within(renewedRow!).getByRole('switch', { name: 'Email' })).toBeInTheDocument();
            expect(within(renewedRow!).queryByRole('switch', { name: 'In-app' })).toBeNull();
        });
    });

    describe('when a toggle is flipped', () => {
        it('should send the matching patch and reflect it optimistically', async () => {
            renderPrefs();

            // Server echoes the patched state on success.
            mockUpdatePreferences.mockResolvedValue({
                ...ALL_ON,
                storyCompleted: { email: false, inApp: true },
            });

            const readyRow = (await screen.findByText('Tale is ready')).closest('li');
            const emailSwitch = within(readyRow!).getByRole('switch', { name: 'Email' });

            await userEvent.click(emailSwitch);

            expect(mockUpdatePreferences).toHaveBeenCalledWith(
                { storyCompleted: { email: false } },
                expect.anything(),
            );
            await waitFor(() => expect(emailSwitch).not.toBeChecked());
        });
    });

    describe('when loading fails', () => {
        it('should show an error message', async () => {
            mockGetPreferences.mockRejectedValue(new Error('boom'));
            renderPrefs();

            expect(await screen.findByText(/couldn't load your preferences/i)).toBeInTheDocument();
        });
    });
});

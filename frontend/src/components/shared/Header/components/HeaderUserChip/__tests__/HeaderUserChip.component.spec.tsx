import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import HeaderUserChip from '../HeaderUserChip';

const mockLogout = vi.hoisted(() => vi.fn());
const mockUser = vi.hoisted(() => ({ current: { name: 'Alice Wonderland', role: 'USER' } }));

vi.mock('@/api/auth', () => ({
    authApi: { logout: mockLogout },
}));

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: () => ({ user: mockUser.current }),
}));

vi.mock('@/hooks/subscription', () => ({
    useSubscription: () => ({ data: { tier: { name: 'Free Chapter' } } }),
}));

function renderChip(): void {
    render(
        <MantineProvider env="test">
            <HeaderUserChip />
        </MantineProvider>,
    );
}

describe('HeaderUserChip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockLogout.mockResolvedValue(undefined);
        mockUser.current = { name: 'Alice Wonderland', role: 'USER' };
    });

    describe('trigger', () => {
        it('should show the user first name and plan', () => {
            renderChip();
            const trigger = screen.getByRole('button', { name: /account menu/i });
            expect(within(trigger).getByText('Alice')).toBeInTheDocument();
            expect(within(trigger).getByText('Free Chapter')).toBeInTheDocument();
        });

        it('should not show the menu until opened', () => {
            renderChip();
            expect(screen.queryByRole('link', { name: 'My account' })).not.toBeInTheDocument();
        });
    });

    describe('when opened', () => {
        it('should reveal the account links and a sign-out action', async () => {
            renderChip();

            await userEvent.click(screen.getByRole('button', { name: /account menu/i }));

            expect(await screen.findByRole('link', { name: 'My account' })).toHaveAttribute(
                'href',
                '/account',
            );
            expect(screen.getByRole('link', { name: 'Subscription' })).toHaveAttribute(
                'href',
                '/account/subscription',
            );
            expect(screen.getByRole('link', { name: 'Children' })).toHaveAttribute(
                'href',
                '/account/children',
            );
            expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
        });

        it('should not show the admin panel link for a non-admin', async () => {
            renderChip();

            await userEvent.click(screen.getByRole('button', { name: /account menu/i }));

            await screen.findByRole('link', { name: 'My account' });
            expect(screen.queryByRole('link', { name: 'Admin panel' })).not.toBeInTheDocument();
        });

        it('should show the admin panel link for an admin', async () => {
            mockUser.current = { name: 'Alice Wonderland', role: 'SUPER_ADMIN' };
            renderChip();

            await userEvent.click(screen.getByRole('button', { name: /account menu/i }));

            expect(await screen.findByRole('link', { name: 'Admin panel' })).toHaveAttribute(
                'href',
                '/admin',
            );
        });
    });

    describe('when Sign out is clicked', () => {
        it('should call the logout endpoint', async () => {
            renderChip();

            await userEvent.click(screen.getByRole('button', { name: /account menu/i }));
            await userEvent.click(await screen.findByRole('button', { name: 'Sign out' }));

            expect(mockLogout).toHaveBeenCalledOnce();
        });
    });
});

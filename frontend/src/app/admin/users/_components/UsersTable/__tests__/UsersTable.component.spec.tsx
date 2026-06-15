import { render, screen, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import UsersTable, { type IUsersTableProps } from '../UsersTable';
import type { IAdminUserSummary } from '@/types/admin.types';

const SELF: IAdminUserSummary = {
    id: 'self',
    email: 'self@b.com',
    name: 'Self Admin',
    avatarUrl: null,
    role: 'SUPER_ADMIN',
    suspendedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    subscriptionTier: 'Free Chapter',
    storiesCount: 3,
};

const OTHER: IAdminUserSummary = {
    ...SELF,
    id: 'other',
    name: 'Other User',
    email: 'other@b.com',
    role: 'USER',
};

const SUSPENDED: IAdminUserSummary = {
    ...OTHER,
    id: 'suspended',
    name: 'Banned User',
    suspendedAt: '2026-02-01T00:00:00Z',
};

function renderTable(props: Partial<IUsersTableProps> = {}): void {
    render(
        <MantineProvider env="test">
            <UsersTable
                users={[SELF, OTHER, SUSPENDED]}
                currentUserId="self"
                canChangeRoles
                onRoleChange={vi.fn()}
                onToggleSuspend={vi.fn()}
                isMutating={false}
                {...props}
            />
        </MantineProvider>,
    );
}

function rowFor(name: string): HTMLElement {
    return screen.getByText(name).closest('tr') as HTMLElement;
}

describe('UsersTable', () => {
    describe('when the viewer can change roles', () => {
        it('should render a role selector for other users', () => {
            renderTable();

            expect(
                within(rowFor('Other User')).getByRole('combobox', { name: /role for/i }),
            ).toBeInTheDocument();
        });

        it('should disable the suspend action on the viewer own row', () => {
            renderTable();

            expect(within(rowFor('Self Admin')).getByRole('button')).toBeDisabled();
        });
    });

    describe('when the viewer cannot change roles', () => {
        it('should render the role as plain text', () => {
            renderTable({ canChangeRoles: false });

            const row = rowFor('Other User');
            expect(within(row).queryByRole('combobox')).not.toBeInTheDocument();
            expect(within(row).getByText('USER')).toBeInTheDocument();
        });
    });

    describe('suspension state', () => {
        it('should label the action Reinstate for a suspended user', () => {
            renderTable();

            expect(
                within(rowFor('Banned User')).getByRole('button', { name: 'Reinstate' }),
            ).toBeInTheDocument();
        });

        it('should label the action Suspend for an active user', () => {
            renderTable();

            expect(
                within(rowFor('Other User')).getByRole('button', { name: 'Suspend' }),
            ).toBeInTheDocument();
        });
    });
});

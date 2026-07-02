import { render, screen, waitFor } from '@testing-library/react';
import type { IUserContext } from '@/context/UserContext';
import AuthGuard from './AuthGuard';

const mockRouterReplace = vi.hoisted(() => vi.fn());
const mockUseCurrentUser = vi.hoisted(() => vi.fn());

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: mockUseCurrentUser,
}));

vi.mock('@/i18n/navigation', () => ({
    Link: ({
        href,
        children,
        ...rest
    }: {
        href: string;
        children: React.ReactNode;
        [key: string]: unknown;
    }) => (
        <a href={href} {...(rest as object)}>
            {children}
        </a>
    ),
    useRouter: vi.fn().mockReturnValue({ replace: mockRouterReplace }),
}));

function makeContext(overrides: Partial<IUserContext> = {}): IUserContext {
    return { user: null, isLoading: false, refetch: vi.fn(), ...overrides };
}

describe('AuthGuard', () => {
    beforeEach(() => {
        mockRouterReplace.mockClear();
    });

    it('should render null and redirect to /login when there is no user', async () => {
        mockUseCurrentUser.mockReturnValue(makeContext({ user: null }));

        const { container } = render(
            <AuthGuard>
                <div>Protected content</div>
            </AuthGuard>,
        );

        expect(container.firstChild).toBeNull();
        await waitFor(() => {
            expect(mockRouterReplace).toHaveBeenCalledWith('/login');
        });
    });

    it('should render children when the user is authenticated', () => {
        const user: import('@/types/user.types').IUser = {
            id: 'user-123',
            email: 'alice@example.com',
            name: 'Alice',
            avatarUrl: null,
            hasCustomAvatar: false,
            role: 'USER',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
        };
        mockUseCurrentUser.mockReturnValue(makeContext({ user }));

        render(
            <AuthGuard>
                <div>Protected content</div>
            </AuthGuard>,
        );

        expect(screen.getByText('Protected content')).toBeInTheDocument();
        expect(mockRouterReplace).not.toHaveBeenCalled();
    });
});

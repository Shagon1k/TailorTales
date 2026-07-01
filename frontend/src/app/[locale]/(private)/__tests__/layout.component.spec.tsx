import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IUserContext } from '@/context/UserContext';
import type { IUser } from '@/types/user.types';
import PrivateLayout from '../layout';

const mockRouterReplace = vi.hoisted(() => vi.fn());
const mockUseCurrentUser = vi.hoisted(() => vi.fn());

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: mockUseCurrentUser,
}));

vi.mock('@/hooks/subscription', () => ({
    useSubscription: () => ({ data: undefined }),
}));

// async server component — stub it for sync render
vi.mock('@/components/shared/Footer/Footer', () => ({
    default: () => <footer />,
}));

// NotificationCenter (inside Header) opens an SSE stream — stub the whole API module.
vi.mock('@/api/notifications', () => ({
    notificationsApi: {
        getAll: vi.fn().mockResolvedValue([]),
        getUnreadCount: vi.fn().mockResolvedValue(0),
        markRead: vi.fn(),
        markAllRead: vi.fn(),
        openUnreadCountStream: vi.fn().mockReturnValue({ onmessage: null, close: vi.fn() }),
    },
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
    usePathname: vi.fn().mockReturnValue('/account'),
}));

const TEST_USER: IUser = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Wonderland',
    avatarUrl: null,
    hasCustomAvatar: false,
    role: 'USER',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeContext(overrides: Partial<IUserContext> = {}): IUserContext {
    return { user: TEST_USER, isLoading: false, refetch: vi.fn(), ...overrides };
}

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <MantineProvider env="test">
            <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
        </MantineProvider>,
    );
}

describe('PrivateLayout', () => {
    describe('given an authenticated user', () => {
        beforeEach(() => {
            mockUseCurrentUser.mockReturnValue(makeContext());
        });

        it('should render children inside a main landmark', () => {
            renderWithMantine(
                <PrivateLayout>
                    <div>Dashboard content</div>
                </PrivateLayout>,
            );

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
            expect(main).toHaveTextContent('Dashboard content');
        });

        it('should render a header landmark', () => {
            renderWithMantine(
                <PrivateLayout>
                    <div>Dashboard content</div>
                </PrivateLayout>,
            );

            expect(screen.getByRole('banner')).toBeInTheDocument();
        });

        it('should render a footer landmark', () => {
            renderWithMantine(
                <PrivateLayout>
                    <div>Dashboard content</div>
                </PrivateLayout>,
            );

            expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        });
    });

    describe('given no authenticated user', () => {
        beforeEach(() => {
            mockUseCurrentUser.mockReturnValue(makeContext({ user: null }));
        });

        it('should not render children', () => {
            renderWithMantine(
                <PrivateLayout>
                    <div>Dashboard content</div>
                </PrivateLayout>,
            );

            expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
        });
    });
});

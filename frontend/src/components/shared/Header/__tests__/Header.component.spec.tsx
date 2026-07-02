import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IUserContext } from '@/context/UserContext';
import type { IUser } from '@/types/user.types';
import Header from '../Header';

const mockUseCurrentUser = vi.hoisted(() => vi.fn());

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: mockUseCurrentUser,
}));

vi.mock('@/hooks/subscription', () => ({
    useSubscription: () => ({ data: undefined }),
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

describe('Header', () => {
    describe('given variant="public"', () => {
        it('should render the brand mark link', () => {
            renderWithMantine(<Header variant="public" />);
            expect(screen.getByRole('link', { name: /tailortales/i })).toBeInTheDocument();
        });

        it('should render How it works navigation link', () => {
            renderWithMantine(<Header variant="public" />);
            expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
        });

        it('should render Pricing navigation link', () => {
            renderWithMantine(<Header variant="public" />);
            expect(screen.getByRole('link', { name: /pricing/i })).toBeInTheDocument();
        });

        it('should render Sign in navigation link', () => {
            renderWithMantine(<Header variant="public" />);
            expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
        });

        it('should render the Begin a tale CTA', () => {
            renderWithMantine(<Header variant="public" />);
            expect(screen.getByRole('link', { name: /begin a tale/i })).toBeInTheDocument();
        });

        it('should not render private navigation links', () => {
            renderWithMantine(<Header variant="public" />);
            expect(screen.queryByRole('link', { name: /library/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: /workshop/i })).not.toBeInTheDocument();
        });
    });

    describe('given variant="private"', () => {
        beforeEach(() => {
            mockUseCurrentUser.mockReturnValue(makeContext());
        });

        it('should render the brand mark link', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('link', { name: /tailortales/i })).toBeInTheDocument();
        });

        it('should render Library navigation link', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument();
        });

        it('should render Workshop navigation link', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('link', { name: /workshop/i })).toBeInTheDocument();
        });

        it('should render Pricing navigation link', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('link', { name: /pricing/i })).toBeInTheDocument();
        });

        it('should render Notifications button', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
        });

        it('should render the account menu trigger', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('button', { name: /account menu/i })).toBeInTheDocument();
        });

        it('should not render unauthenticated-only navigation links', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.queryByRole('link', { name: /how it works/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: /sign in/i })).not.toBeInTheDocument();
        });
    });
});

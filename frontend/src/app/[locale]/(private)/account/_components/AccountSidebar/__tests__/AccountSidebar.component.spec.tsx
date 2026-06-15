import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IUserContext } from '@/context/UserContext';
import type { IUser } from '@/types/user.types';
import AccountSidebar from '../AccountSidebar';

const mockRouterReplace = vi.hoisted(() => vi.fn());
const mockPathname = vi.hoisted(() => vi.fn(() => '/account/profile'));
const mockUseCurrentUser = vi.hoisted(() => vi.fn());
const mockLogout = vi.hoisted(() => vi.fn());

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
    usePathname: mockPathname,
}));

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: mockUseCurrentUser,
}));

vi.mock('@/api/auth', () => ({
    authApi: { logout: mockLogout },
}));

const TEST_USER: IUser = {
    id: 'user-1',
    email: 'alice@example.com',
    name: 'Alice Wonderland',
    avatarUrl: null,
    role: 'USER',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeContext(overrides: Partial<IUserContext> = {}): IUserContext {
    return { user: TEST_USER, isLoading: false, refetch: vi.fn(), ...overrides };
}

describe('AccountSidebar', () => {
    beforeEach(() => {
        mockUseCurrentUser.mockReturnValue(makeContext());
        mockPathname.mockReturnValue('/account/profile');
        mockLogout.mockResolvedValue(undefined);
        mockRouterReplace.mockClear();
    });

    describe('given a logged-in user', () => {
        it('should display the user name and email', () => {
            render(<AccountSidebar />);

            expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
            expect(screen.getByText('alice@example.com')).toBeInTheDocument();
        });

        it('should display the first initial in the avatar', () => {
            render(<AccountSidebar />);

            expect(screen.getByText('A')).toBeInTheDocument();
        });

        it('should render all nav items', () => {
            render(<AccountSidebar />);

            expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /children/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /subscription/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /notifications/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /language/i })).toBeInTheDocument();
            expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument();
        });

        it('should link nav items to the correct hrefs', () => {
            render(<AccountSidebar />);

            expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute(
                'href',
                '/account/profile',
            );
            expect(screen.getByRole('link', { name: /children/i })).toHaveAttribute(
                'href',
                '/account/children',
            );
            expect(screen.getByRole('link', { name: /subscription/i })).toHaveAttribute(
                'href',
                '/account/subscription',
            );
        });
    });

    describe('given the current pathname is /account/profile', () => {
        it('should apply the active modifier to the Profile link', () => {
            mockPathname.mockReturnValue('/account/profile');
            render(<AccountSidebar />);

            const profileLink = screen.getByRole('link', { name: /profile/i });
            expect(profileLink.className).toMatch(/m-active/);
        });

        it('should not apply the active modifier to other links', () => {
            mockPathname.mockReturnValue('/account/profile');
            render(<AccountSidebar />);

            const childrenLink = screen.getByRole('link', { name: /children/i });
            expect(childrenLink.className).not.toMatch(/m-active/);
        });
    });

    describe('given the current pathname is /account/subscription', () => {
        it('should apply the active modifier to the Subscription link', () => {
            mockPathname.mockReturnValue('/account/subscription');
            render(<AccountSidebar />);

            const subscriptionLink = screen.getByRole('link', { name: /subscription/i });
            expect(subscriptionLink.className).toMatch(/m-active/);
        });
    });

    describe('when Sign out is clicked', () => {
        it('should call authApi.logout and hard-redirect home', async () => {
            const hrefSetter = vi.fn();
            const originalLocation = globalThis.location;
            Object.defineProperty(globalThis, 'location', {
                configurable: true,
                value: {
                    get href() {
                        return '';
                    },
                    set href(value: string) {
                        hrefSetter(value);
                    },
                },
            });

            render(<AccountSidebar />);

            await userEvent.click(screen.getByRole('button', { name: /sign out/i }));

            expect(mockLogout).toHaveBeenCalled();
            expect(hrefSetter).toHaveBeenCalledWith('/');

            Object.defineProperty(globalThis, 'location', {
                configurable: true,
                value: originalLocation,
            });
        });
    });
});

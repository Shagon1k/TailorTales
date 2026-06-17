import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import LoginPage from './page';

const mockRouterReplace = vi.hoisted(() => vi.fn());

// async server component — stub it for sync render
vi.mock('@/components/shared/Footer/Footer', () => ({
    default: () => null,
}));

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: vi.fn().mockReturnValue({ user: null, isLoading: false, refetch: vi.fn() }),
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

function renderLoginPage(): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <LoginPage />
        </MantineProvider>,
    );
}

describe('LoginPage', () => {
    beforeEach(() => {
        mockRouterReplace.mockClear();
    });

    it('should render the Continue with Google button', () => {
        renderLoginPage();

        expect(screen.getByRole('link', { name: /continue with google/i })).toBeInTheDocument();
    });

    it('should link the button to the Google OAuth endpoint', () => {
        renderLoginPage();

        const link = screen.getByRole('link', { name: /continue with google/i });
        expect(link).toHaveAttribute('href', expect.stringContaining('/auth/google'));
    });

    it('should render the welcome heading', () => {
        renderLoginPage();

        expect(
            screen.getByRole('heading', { level: 1, name: /step back into the workshop/i }),
        ).toBeInTheDocument();
    });

    it('should not redirect when no user is logged in', () => {
        renderLoginPage();

        expect(mockRouterReplace).not.toHaveBeenCalled();
    });
});

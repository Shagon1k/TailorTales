import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import LoginPage from './page';

const mockRouterReplace = vi.hoisted(() => vi.fn());

vi.mock('@/context/UserContext', () => ({
    useCurrentUser: vi.fn().mockReturnValue({ user: null, isLoading: false, refetch: vi.fn() }),
}));

vi.mock('next/navigation', () => ({
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
    it('should render the Sign in with Google button', () => {
        renderLoginPage();

        expect(screen.getByRole('link', { name: /sign in with google/i })).toBeInTheDocument();
    });

    it('should link the button to the Google OAuth endpoint', () => {
        renderLoginPage();

        const link = screen.getByRole('link', { name: /sign in with google/i });
        expect(link).toHaveAttribute('href', expect.stringContaining('/auth/google'));
    });

    it('should not redirect when no user is logged in', () => {
        renderLoginPage();

        expect(mockRouterReplace).not.toHaveBeenCalled();
    });
});

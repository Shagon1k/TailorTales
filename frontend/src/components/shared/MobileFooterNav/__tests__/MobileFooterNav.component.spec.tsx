import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from '@/i18n/navigation';
import MobileFooterNav from '../MobileFooterNav';

const mockReplace = vi.fn();
const mockLogout = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('@/api/auth', () => ({
    authApi: {
        logout: mockLogout,
    },
}));

function renderMobileFooterNav(
    pathname = '/library',
    authenticated = true,
): ReturnType<typeof render> {
    vi.mocked(usePathname).mockReturnValue(pathname);
    vi.mocked(useRouter).mockReturnValue({
        back: vi.fn(),
        forward: vi.fn(),
        prefetch: vi.fn(),
        push: vi.fn(),
        refresh: vi.fn(),
        replace: mockReplace,
    });

    return render(<MobileFooterNav authenticated={authenticated} />);
}

describe('MobileFooterNav', () => {
    beforeEach(() => {
        mockReplace.mockReset();
        mockLogout.mockClear();
    });

    describe('given the library route is current', () => {
        it('should render the primary mobile destinations', () => {
            renderMobileFooterNav('/library');

            const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
            expect(within(nav).getByRole('link', { name: 'Library' })).toHaveAttribute(
                'href',
                '/library',
            );
            expect(within(nav).getByRole('link', { name: 'Workshop' })).toHaveAttribute(
                'href',
                '/workshop',
            );
            expect(
                within(nav).getByRole('button', { name: 'Open account navigation' }),
            ).toBeInTheDocument();
            expect(
                within(nav).getByRole('button', { name: 'Open more navigation' }),
            ).toBeInTheDocument();
        });

        it('should mark the current primary route', () => {
            renderMobileFooterNav('/library');

            expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute(
                'aria-current',
                'page',
            );
        });
    });

    describe('when opening more navigation', () => {
        it('should show language controls and secondary links', async () => {
            const user = userEvent.setup();
            renderMobileFooterNav('/library');

            await user.click(screen.getByRole('button', { name: 'Open more navigation' }));

            const more = screen.getByRole('complementary', { name: 'More navigation' });
            expect(within(more).getByLabelText('Language')).toBeInTheDocument();
            expect(within(more).getByRole('button', { name: 'EN' })).toHaveAttribute(
                'aria-current',
                'true',
            );
            expect(within(more).getByRole('link', { name: 'Pricing' })).toHaveAttribute(
                'href',
                '/pricing',
            );
            expect(within(more).getByRole('link', { name: 'How it works' })).toHaveAttribute(
                'href',
                '/how-it-works',
            );
            expect(within(more).getByRole('link', { name: 'Contact us' })).toHaveAttribute(
                'href',
                '/contact',
            );
            expect(within(more).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
                'href',
                '/privacy',
            );
        });

        it('should close more navigation from the backdrop', async () => {
            const user = userEvent.setup();
            renderMobileFooterNav('/library');

            await user.click(screen.getByRole('button', { name: 'Open more navigation' }));
            await user.click(
                screen.getByRole('button', { name: 'Close more navigation backdrop' }),
            );

            expect(
                screen.queryByRole('complementary', { name: 'More navigation' }),
            ).not.toBeInTheDocument();
        });

        it('should switch locale on language selection', async () => {
            const user = userEvent.setup();
            renderMobileFooterNav('/library');

            await user.click(screen.getByRole('button', { name: 'Open more navigation' }));
            await user.click(screen.getByRole('button', { name: 'DE' }));

            expect(mockReplace).toHaveBeenCalledWith('/library', { locale: 'de' });
        });
    });

    describe('when opening account navigation', () => {
        it('should show account section links and actions', async () => {
            const user = userEvent.setup();
            renderMobileFooterNav('/account/profile');

            await user.click(screen.getByRole('button', { name: 'Open account navigation' }));

            const account = screen.getByRole('complementary', { name: 'Account navigation' });
            expect(within(account).getByRole('link', { name: 'Profile' })).toHaveAttribute(
                'href',
                '/account/profile',
            );
            expect(within(account).getByRole('link', { name: 'Children' })).toHaveAttribute(
                'href',
                '/account/children',
            );
            expect(within(account).getByRole('link', { name: 'Subscription' })).toHaveAttribute(
                'href',
                '/account/subscription',
            );
            expect(within(account).getByRole('link', { name: 'Notifications' })).toHaveAttribute(
                'href',
                '/account/notifications',
            );
            expect(within(account).getByRole('link', { name: 'Privacy & data' })).toHaveAttribute(
                'href',
                '/account/privacy',
            );
            expect(within(account).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
            expect(within(account).getByRole('link', { name: 'Delete account' })).toHaveAttribute(
                'href',
                '/account/privacy',
            );
        });

        it('should mark the current account section', async () => {
            const user = userEvent.setup();
            renderMobileFooterNav('/account/profile');

            await user.click(screen.getByRole('button', { name: 'Open account navigation' }));

            expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
                'aria-current',
                'page',
            );
        });
    });

    describe('given no authenticated user', () => {
        it('should render public mobile destinations', () => {
            renderMobileFooterNav('/pricing', false);

            const nav = screen.getByRole('navigation', { name: 'Mobile navigation' });
            expect(within(nav).getByRole('link', { name: 'How it works' })).toHaveAttribute(
                'href',
                '/how-it-works',
            );
            expect(within(nav).getByRole('link', { name: 'Pricing' })).toHaveAttribute(
                'href',
                '/pricing',
            );
            expect(within(nav).getByRole('link', { name: 'Sign in' })).toHaveAttribute(
                'href',
                '/login',
            );
            expect(within(nav).queryByRole('link', { name: 'Library' })).not.toBeInTheDocument();
            expect(within(nav).queryByRole('link', { name: 'Workshop' })).not.toBeInTheDocument();
        });

        it('should mark sign in as current on the login route', () => {
            renderMobileFooterNav('/login', false);

            expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
                'aria-current',
                'page',
            );
        });

        it('should keep contact and privacy in public more navigation', async () => {
            const user = userEvent.setup();
            renderMobileFooterNav('/pricing', false);

            await user.click(screen.getByRole('button', { name: 'Open more navigation' }));

            const more = screen.getByRole('complementary', { name: 'More navigation' });
            expect(within(more).getByRole('link', { name: 'Contact us' })).toHaveAttribute(
                'href',
                '/contact',
            );
            expect(within(more).getByRole('link', { name: 'Privacy' })).toHaveAttribute(
                'href',
                '/privacy',
            );
            expect(within(more).queryByRole('link', { name: 'Pricing' })).not.toBeInTheDocument();
            expect(
                within(more).queryByRole('link', { name: 'How it works' }),
            ).not.toBeInTheDocument();
        });
    });

    describe('given a secondary route is current', () => {
        it('should mark the more tab as current', () => {
            renderMobileFooterNav('/privacy');

            expect(screen.getByRole('button', { name: 'Open more navigation' })).toHaveAttribute(
                'aria-current',
                'page',
            );
        });
    });
});

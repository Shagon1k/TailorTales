import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// async server component — stub it for sync render
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
}));

describe('Footer', () => {
    describe('given the footer renders', () => {
        it('should render the brand mark', async () => {
            render(await Footer());
            expect(screen.getByRole('link', { name: /tailortales/i })).toBeInTheDocument();
        });

        it('should display the tagline', async () => {
            render(await Footer());
            expect(screen.getByText(/a small workshop for one child/i)).toBeInTheDocument();
        });

        it('should render the Privacy link pointing to /privacy', async () => {
            render(await Footer());
            const link = screen.getByRole('link', { name: /privacy/i });
            expect(link).toHaveAttribute('href', '/privacy');
        });

        it('should render the Terms link pointing to /terms', async () => {
            render(await Footer());
            const link = screen.getByRole('link', { name: /terms/i });
            expect(link).toHaveAttribute('href', '/terms');
        });

        it('should render the Contact link pointing to /contact', async () => {
            render(await Footer());
            const link = screen.getByRole('link', { name: /contact/i });
            expect(link).toHaveAttribute('href', '/contact');
        });
    });
});

import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
    describe('given the footer renders', () => {
        it('should render the brand mark', () => {
            render(<Footer />);
            expect(screen.getByRole('link', { name: /tailortales/i })).toBeInTheDocument();
        });

        it('should display the tagline', () => {
            render(<Footer />);
            expect(screen.getByText(/a small workshop for one child/i)).toBeInTheDocument();
        });

        it('should render the Privacy link pointing to /privacy', () => {
            render(<Footer />);
            const link = screen.getByRole('link', { name: /privacy/i });
            expect(link).toHaveAttribute('href', '/privacy');
        });

        it('should render the Contact link pointing to /contact', () => {
            render(<Footer />);
            const link = screen.getByRole('link', { name: /contact/i });
            expect(link).toHaveAttribute('href', '/contact');
        });
    });
});

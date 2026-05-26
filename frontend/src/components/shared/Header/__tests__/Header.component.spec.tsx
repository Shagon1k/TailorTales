import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Header from '../Header';

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
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

        it('should render Notifications button', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
        });

        it('should render Account button', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.getByRole('button', { name: /account/i })).toBeInTheDocument();
        });

        it('should not render public navigation links', () => {
            renderWithMantine(<Header variant="private" />);
            expect(screen.queryByRole('link', { name: /how it works/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: /pricing/i })).not.toBeInTheDocument();
        });
    });
});

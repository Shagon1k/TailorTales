import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import HomePage from '../page';

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('HomePage', () => {
    describe('given the page renders', () => {
        it('should display the app title', () => {
            renderWithMantine(<HomePage />);
            expect(screen.getByRole('heading', { name: /tailortales/i })).toBeInTheDocument();
        });

        it('should display the tagline', () => {
            renderWithMantine(<HomePage />);
            expect(screen.getByText(/personalized ai-generated/i)).toBeInTheDocument();
        });

        it('should display a get started button', () => {
            renderWithMantine(<HomePage />);
            expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
        });
    });
});

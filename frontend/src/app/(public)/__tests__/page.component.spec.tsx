import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import HomePage from '../page';

// CtaSection is an async server component (reads the session) — stub it for sync render.
vi.mock('@/app/(public)/_components/CtaSection/CtaSection', () => ({
    default: () => null,
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('HomePage', () => {
    describe('given the page renders', () => {
        it('should display the page heading', () => {
            renderWithMantine(<HomePage />);
            expect(
                screen.getByRole('heading', { level: 1, name: /where their questions/i }),
            ).toBeInTheDocument();
        });

        it('should display the hero subtext', () => {
            renderWithMantine(<HomePage />);
            expect(screen.getByText(/a small workshop/i)).toBeInTheDocument();
        });

        it('should display the primary CTA link', () => {
            renderWithMantine(<HomePage />);
            expect(
                screen.getByRole('link', { name: /light the first lantern/i }),
            ).toBeInTheDocument();
        });
    });
});

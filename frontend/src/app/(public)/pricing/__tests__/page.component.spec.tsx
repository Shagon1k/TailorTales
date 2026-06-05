import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import PricingPage from '../page';

// CtaSection is an async server component (reads the session) — stub it for sync render.
vi.mock('@/app/(public)/_components/CtaSection/CtaSection', () => ({
    default: () => null,
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('PricingPage', () => {
    it('should render the page heading', () => {
        renderWithMantine(<PricingPage />);

        expect(
            screen.getByRole('heading', { level: 1, name: /priced like a small workshop/i }),
        ).toBeInTheDocument();
    });

    it('should display all three pricing plan names', () => {
        renderWithMantine(<PricingPage />);

        expect(screen.getByRole('heading', { name: /free chapter/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Story Hour' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /family workshop/i })).toBeInTheDocument();
    });
});

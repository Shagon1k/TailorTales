import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import HowItWorksPage from '../page';

// CtaSection is an async server component (reads the session) — stub it for sync render.
vi.mock('@/app/[locale]/(public)/_components/CtaSection/CtaSection', () => ({
    default: () => null,
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('HowItWorksPage', () => {
    it('should render the page heading', () => {
        renderWithMantine(<HowItWorksPage />);

        expect(
            screen.getByRole('heading', { level: 1, name: /three small steps/i }),
        ).toBeInTheDocument();
    });

    it('should display the eyebrow label', () => {
        renderWithMantine(<HowItWorksPage />);

        expect(screen.getByText('How it works')).toBeInTheDocument();
    });

    it('should display all three step cards', () => {
        renderWithMantine(<HowItWorksPage />);

        expect(screen.getByText(/light a name/i)).toBeInTheDocument();
        expect(screen.getByText(/whisper a why/i)).toBeInTheDocument();
        expect(screen.getByText(/carry it home/i)).toBeInTheDocument();
    });
});

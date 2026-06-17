import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import HowItWorksPage from '../page';

// async server components — stub them for sync render.
vi.mock('@/app/[locale]/(public)/_components/CtaSection/CtaSection', () => ({
    default: () => null,
}));

vi.mock(
    '@/app/[locale]/(public)/how-it-works/_components/DetailedStepsSection/DetailedStepsSection',
    () => ({
        default: () => (
            <div>
                <p>Light a name</p>
                <p>Whisper a why</p>
                <p>Carry it home</p>
            </div>
        ),
    }),
);

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('HowItWorksPage', () => {
    it('should render the page heading', async () => {
        renderWithMantine(await HowItWorksPage());

        expect(
            screen.getByRole('heading', { level: 1, name: /three small steps/i }),
        ).toBeInTheDocument();
    });

    it('should display the eyebrow label', async () => {
        renderWithMantine(await HowItWorksPage());

        expect(screen.getByText('How it works')).toBeInTheDocument();
    });

    it('should display all three step cards', async () => {
        renderWithMantine(await HowItWorksPage());

        expect(screen.getByText(/light a name/i)).toBeInTheDocument();
        expect(screen.getByText(/whisper a why/i)).toBeInTheDocument();
        expect(screen.getByText(/carry it home/i)).toBeInTheDocument();
    });
});

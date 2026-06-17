import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import HomePage from '../page';

vi.mock('@/api/user.server', () => ({
    getServerUser: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/api/stories.server', () => ({
    storiesServerApi: { getPublic: vi.fn().mockResolvedValue([]) },
}));

// async server components — stub them for sync render.
vi.mock('@/app/[locale]/(public)/_components/CtaSection/CtaSection', () => ({
    default: () => null,
}));

vi.mock('@/app/[locale]/(public)/_components/HeroSection/HeroSection', () => ({
    default: () => (
        <>
            <h1>Where their questions become their stories.</h1>
            <p>
                A small workshop that takes your child&apos;s name, age and curiosity, and stitches
                them into a tiny book or comic — five to twenty pages, theirs to keep forever.
            </p>
            <a href="/login">Begin your first tale →</a>
        </>
    ),
}));

vi.mock('@/app/[locale]/(public)/_components/LanternsSection/LanternsSection', () => ({
    default: () => null,
}));

vi.mock('@/app/[locale]/(public)/_components/TalesSection/TalesSection', () => ({
    default: () => null,
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('HomePage', () => {
    describe('given the page renders', () => {
        it('should display the page heading', async () => {
            renderWithMantine(await HomePage());
            expect(
                screen.getByRole('heading', { level: 1, name: /where their questions/i }),
            ).toBeInTheDocument();
        });

        it('should display the hero subtext', async () => {
            renderWithMantine(await HomePage());
            expect(screen.getByText(/a small workshop/i)).toBeInTheDocument();
        });

        it('should display the primary CTA link', async () => {
            renderWithMantine(await HomePage());
            expect(
                screen.getByRole('link', { name: /begin your first tale/i }),
            ).toBeInTheDocument();
        });
    });
});

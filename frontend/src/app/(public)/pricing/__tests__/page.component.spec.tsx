import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import type { IPricingTier } from '@/types/pricing.types';
import PricingPage from '../page';

// CtaSection is an async server component (reads the session) — stub it for sync render.
vi.mock('@/app/(public)/_components/CtaSection/CtaSection', () => ({
    default: () => null,
}));

// PriceCard reads session + subscription hooks — pin them to the public (logged-out) state.
vi.mock('@/context/UserContext', () => ({
    useCurrentUser: () => ({ user: null, isLoading: false }),
}));
vi.mock('@/hooks/subscription', () => ({
    useSubscription: () => ({ data: undefined }),
}));

const MOCK_TIERS: IPricingTier[] = [
    {
        id: 'tier-free',
        name: 'Free Chapter',
        paddleProductId: null,
        paddlePriceId: null,
        priceMonthly: 0,
        pagesPerMonth: 12,
        regenerationsPerMonth: 3,
        childrenLimit: 1,
        retentionDays: 30,
        watermark: true,
        order: 1,
    },
    {
        id: 'tier-story-hour',
        name: 'Story Hour',
        paddleProductId: 'pro_1',
        paddlePriceId: 'pri_1',
        priceMonthly: 500,
        pagesPerMonth: 60,
        regenerationsPerMonth: 10,
        childrenLimit: 3,
        retentionDays: null,
        watermark: false,
        order: 2,
    },
    {
        id: 'tier-family',
        name: 'Family Workshop',
        paddleProductId: 'pro_2',
        paddlePriceId: 'pri_2',
        priceMonthly: 1000,
        pagesPerMonth: 150,
        regenerationsPerMonth: 30,
        childrenLimit: null,
        retentionDays: null,
        watermark: false,
        order: 3,
    },
];

vi.mock('@/api/pricing.server', () => ({
    pricingServerApi: { getAll: vi.fn(() => Promise.resolve(MOCK_TIERS)) },
}));

async function renderPage(): Promise<void> {
    const page = await PricingPage();
    render(<MantineProvider>{page}</MantineProvider>);
}

describe('PricingPage', () => {
    it('should render the page heading', async () => {
        await renderPage();

        expect(
            screen.getByRole('heading', { level: 1, name: /priced like a small workshop/i }),
        ).toBeInTheDocument();
    });

    it('should display all three pricing plan names from the API', async () => {
        await renderPage();

        expect(screen.getByRole('heading', { name: /free chapter/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Story Hour' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /family workshop/i })).toBeInTheDocument();
    });

    it('should derive prices and quota copy from the tier data', async () => {
        await renderPage();

        expect(screen.getByText('€5')).toBeInTheDocument();
        expect(screen.getByText('€10')).toBeInTheDocument();
        expect(screen.getByText('Up to 60 pages a month')).toBeInTheDocument();
        expect(screen.getByText('1 tale per month (up to 12 pages)')).toBeInTheDocument();
    });

    it('should send unauthenticated visitors to login from every plan CTA', async () => {
        await renderPage();

        const ctaLinks = [
            screen.getByRole('link', { name: /begin free/i }),
            screen.getByRole('link', { name: /join story hour/i }),
            screen.getByRole('link', { name: /open the workshop/i }),
        ];
        for (const link of ctaLinks) {
            expect(link).toHaveAttribute('href', '/login');
        }
    });
});

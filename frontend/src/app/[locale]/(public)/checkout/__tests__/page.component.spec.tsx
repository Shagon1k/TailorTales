import { render, screen } from '@testing-library/react';
import { redirect } from '@/i18n/navigation';
import CheckoutPage from '../page';

const mockRedirect = vi.hoisted(() => vi.fn());

vi.mock('@/i18n/navigation', () => ({
    redirect: mockRedirect,
}));

vi.mock('../_components/PaddlePaymentLink/PaddlePaymentLink', () => ({
    default: () => <div>Paddle payment link</div>,
}));

describe('CheckoutPage', () => {
    beforeEach(() => {
        mockRedirect.mockReset();
        mockRedirect.mockImplementation(() => {
            throw new Error('NEXT_REDIRECT');
        });
    });

    it('should initialize the Paddle payment link for a transaction query', async () => {
        const page = await CheckoutPage({
            params: Promise.resolve({ locale: 'en' }),
            searchParams: Promise.resolve({ _ptxn: 'txn_123' }),
        });

        render(page);

        expect(screen.getByText('Paddle payment link')).toBeInTheDocument();
        expect(redirect).not.toHaveBeenCalled();
    });

    it('should redirect a direct visit to the localized pricing page', async () => {
        const renderPage = CheckoutPage({
            params: Promise.resolve({ locale: 'de' }),
            searchParams: Promise.resolve({}),
        });

        await expect(renderPage).rejects.toThrow('NEXT_REDIRECT');
        expect(redirect).toHaveBeenCalledWith({ href: '/pricing', locale: 'de' });
    });
});

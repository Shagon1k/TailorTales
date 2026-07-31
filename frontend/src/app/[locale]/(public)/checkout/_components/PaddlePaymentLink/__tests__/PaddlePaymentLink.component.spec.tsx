import { render, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { getPaddle } from '@/lib/paddle';
import PaddlePaymentLink from '../PaddlePaymentLink';

const mockRouterReplace = vi.hoisted(() => vi.fn());

vi.mock('@/i18n/navigation', () => ({
    useRouter: vi.fn().mockReturnValue({ replace: mockRouterReplace }),
}));

vi.mock('@/lib/paddle', () => ({
    getPaddle: vi.fn(),
}));

function renderPaymentLink(): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <PaddlePaymentLink />
        </MantineProvider>,
    );
}

describe('PaddlePaymentLink', () => {
    beforeEach(() => {
        vi.mocked(getPaddle).mockReset();
        mockRouterReplace.mockReset();
    });

    it('should initialize Paddle when the payment-link page mounts', async () => {
        vi.mocked(getPaddle).mockReturnValue(new Promise<never>(() => {}));

        renderPaymentLink();

        await waitFor(() => expect(getPaddle).toHaveBeenCalledOnce());
        expect(mockRouterReplace).not.toHaveBeenCalled();
    });

    it('should return to pricing when Paddle is not configured', async () => {
        vi.mocked(getPaddle).mockResolvedValue(undefined);

        renderPaymentLink();

        await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/pricing'));
    });
});

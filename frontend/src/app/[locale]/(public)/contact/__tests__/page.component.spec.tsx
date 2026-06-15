import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import ContactPage from '../page';

vi.mock('../_components/ContactSection/actions', () => ({
    submitContact: vi.fn().mockResolvedValue({ status: 'idle' }),
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('ContactPage', () => {
    it('should render the page heading', () => {
        renderWithMantine(<ContactPage />);

        expect(
            screen.getByRole('heading', { level: 1, name: /get in touch/i }),
        ).toBeInTheDocument();
    });

    it('should display the contact form send button', () => {
        renderWithMantine(<ContactPage />);

        expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
});

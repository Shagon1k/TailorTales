import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import ContactPage from '../page';

vi.mock('../_components/ContactSection/actions', () => ({
    submitContact: vi.fn().mockResolvedValue({ status: 'idle' }),
}));

// async server component — stub it for sync render
vi.mock('@/app/[locale]/(public)/contact/_components/ContactSection/ContactSection', () => ({
    default: () => (
        <section>
            <button type="submit">Send message →</button>
        </section>
    ),
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('ContactPage', () => {
    it('should render the page heading', async () => {
        renderWithMantine(await ContactPage());

        expect(
            screen.getByRole('heading', { level: 1, name: /get in touch/i }),
        ).toBeInTheDocument();
    });

    it('should display the contact form send button', async () => {
        renderWithMantine(await ContactPage());

        expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
});

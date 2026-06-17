import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import PublicLayout from '../layout';

const mockGetServerUser = vi.hoisted(() => vi.fn());

vi.mock('@/api/user.server', () => ({
    getServerUser: mockGetServerUser,
}));

// async server component — stub it for sync render
vi.mock('@/components/shared/Footer/Footer', () => ({
    default: () => <footer />,
}));

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

// PublicLayout is an async server component — resolve it, then render the element.
async function renderLayout(children: React.ReactNode): Promise<void> {
    const ui = await PublicLayout({ children });
    renderWithMantine(ui);
}

describe('PublicLayout', () => {
    beforeEach(() => {
        mockGetServerUser.mockResolvedValue(null);
    });

    describe('given any children', () => {
        it('should render children inside a main landmark', async () => {
            await renderLayout(<div>Page content</div>);

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
            expect(main).toHaveTextContent('Page content');
        });

        it('should render a header landmark', async () => {
            await renderLayout(<div>Page content</div>);

            expect(screen.getByRole('banner')).toBeInTheDocument();
        });

        it('should render a footer landmark', async () => {
            await renderLayout(<div>Page content</div>);

            expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        });
    });
});

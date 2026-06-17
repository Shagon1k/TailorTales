import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { useRouter, usePathname } from '@/i18n/navigation';
import LocaleSwitcher from '../LocaleSwitcher';

const mockReplace = vi.fn();

beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
        push: vi.fn(),
        replace: mockReplace,
        back: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(usePathname).mockReturnValue('/');
});

afterEach(() => {
    mockReplace.mockReset();
});

function renderSwitcher(): ReturnType<typeof render> {
    return render(
        <MantineProvider env="test">
            <LocaleSwitcher />
        </MantineProvider>,
    );
}

describe('LocaleSwitcher', () => {
    it('should render a trigger button with the current locale code', () => {
        renderSwitcher();
        expect(screen.getByRole('button', { name: /switch language/i })).toBeInTheDocument();
    });

    it('should show all locale options after opening the dropdown', async () => {
        renderSwitcher();
        await userEvent.click(screen.getByRole('button', { name: /switch language/i }));
        expect(screen.getByRole('menuitemradio', { name: /english/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', { name: /deutsch/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitemradio', { name: /русский/i })).toBeInTheDocument();
    });

    it('should mark the current locale as checked', async () => {
        renderSwitcher();
        await userEvent.click(screen.getByRole('button', { name: /switch language/i }));
        expect(screen.getByRole('menuitemradio', { name: /english/i })).toHaveAttribute(
            'aria-checked',
            'true',
        );
        expect(screen.getByRole('menuitemradio', { name: /deutsch/i })).toHaveAttribute(
            'aria-checked',
            'false',
        );
    });

    it('should call router.replace with new locale on click', async () => {
        renderSwitcher();
        await userEvent.click(screen.getByRole('button', { name: /switch language/i }));
        await userEvent.click(screen.getByRole('menuitemradio', { name: /deutsch/i }));
        expect(mockReplace).toHaveBeenCalledWith('/', { locale: 'de' });
    });
});

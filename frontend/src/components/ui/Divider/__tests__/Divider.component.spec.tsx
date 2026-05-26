import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Divider from '../Divider';

function renderDivider(props: React.ComponentProps<typeof Divider> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Divider {...props} />
        </MantineProvider>,
    );
}

describe('Divider', () => {
    describe('given default props', () => {
        it('should render a separator', () => {
            renderDivider();
            expect(screen.getByRole('separator')).toBeInTheDocument();
        });
    });

    describe('given variant="needle"', () => {
        it('should render a separator', () => {
            renderDivider({ variant: 'needle' });
            expect(screen.getByRole('separator')).toBeInTheDocument();
        });

        it('should render the needle SVG', () => {
            const { container } = renderDivider({ variant: 'needle' });
            expect(container.querySelector('svg')).toBeInTheDocument();
        });
    });

    describe('given orientation="vertical"', () => {
        it('should render with vertical orientation', () => {
            renderDivider({ orientation: 'vertical' });
            expect(screen.getByRole('separator')).toHaveAttribute('data-orientation', 'vertical');
        });
    });
});

import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Button from '../Button';

function renderButton(props: React.ComponentProps<typeof Button> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Button {...props}>Click me</Button>
        </MantineProvider>,
    );
}

describe('Button', () => {
    describe('given default props', () => {
        it('should render an accessible button', () => {
            renderButton();
            expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
        });

        it('should render children as label', () => {
            renderButton();
            expect(screen.getByText('Click me')).toBeInTheDocument();
        });
    });

    describe('given disabled={true}', () => {
        it('should be disabled', () => {
            renderButton({ disabled: true });
            expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
        });
    });

    describe('given loading={true}', () => {
        it('should have aria-busy set', () => {
            renderButton({ loading: true });
            expect(screen.getByRole('button', { name: /click me/i })).toHaveAttribute('data-loading', 'true');
        });
    });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Switch from '../Switch';

describe('Switch', () => {
    describe('rendering', () => {
        it('should expose a labelled switch reflecting the checked state', () => {
            render(<Switch label="Email" checked onChange={vi.fn()} />);
            const control = screen.getByRole('switch', { name: 'Email' });
            expect(control).toBeChecked();
        });

        it('should be unchecked when checked is false', () => {
            render(<Switch label="Email" checked={false} onChange={vi.fn()} />);
            expect(screen.getByRole('switch', { name: 'Email' })).not.toBeChecked();
        });
    });

    describe('when toggled', () => {
        it('should call onChange with the next value', async () => {
            const onChange = vi.fn();
            render(<Switch label="Email" checked={false} onChange={onChange} />);

            await userEvent.click(screen.getByRole('switch', { name: 'Email' }));

            expect(onChange).toHaveBeenCalledWith(true);
        });
    });

    describe('when disabled', () => {
        it('should not call onChange on click', async () => {
            const onChange = vi.fn();
            render(<Switch label="Email" checked={false} disabled onChange={onChange} />);

            await userEvent.click(screen.getByRole('switch', { name: 'Email' }));

            expect(onChange).not.toHaveBeenCalled();
        });
    });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptionPill from '../OptionPill';

function renderPill(
    props: Omit<React.ComponentProps<typeof OptionPill>, 'children'> = {},
): ReturnType<typeof render> {
    return render(<OptionPill {...props}>Long · 12 pp</OptionPill>);
}

describe('OptionPill', () => {
    describe('given default state', () => {
        it('should render a radio button', () => {
            renderPill();
            expect(screen.getByRole('radio')).toBeInTheDocument();
        });

        it('should display its label', () => {
            renderPill();
            expect(screen.getByText('Long · 12 pp')).toBeInTheDocument();
        });

        it('should not be checked by default', () => {
            renderPill();
            expect(screen.getByRole('radio')).not.toBeChecked();
        });
    });

    describe('given selected', () => {
        it('should be checked', () => {
            renderPill({ selected: true });
            expect(screen.getByRole('radio')).toBeChecked();
        });
    });

    describe('given disabled', () => {
        it('should render a disabled radio button', () => {
            renderPill({ disabled: true });
            expect(screen.getByRole('radio')).toBeDisabled();
        });
    });

    describe('given an onChange handler', () => {
        it('should call onChange when clicked', async () => {
            const onChange = vi.fn();
            renderPill({ onChange });
            await userEvent.click(screen.getByRole('radio'));
            expect(onChange).toHaveBeenCalledOnce();
        });

        it('should not call onChange when disabled', async () => {
            const onChange = vi.fn();
            renderPill({ onChange, disabled: true });
            await userEvent.click(screen.getByRole('radio'));
            expect(onChange).not.toHaveBeenCalled();
        });
    });
});

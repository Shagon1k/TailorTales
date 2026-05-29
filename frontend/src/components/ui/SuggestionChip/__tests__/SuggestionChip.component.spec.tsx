import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuggestionChip from '../SuggestionChip';

describe('SuggestionChip', () => {
    describe('given a label', () => {
        it('should render the label text', () => {
            render(<SuggestionChip label="Why is the sky blue?" onClick={() => {}} />);
            expect(screen.getByText('Why is the sky blue?')).toBeInTheDocument();
        });
    });

    describe('given a click handler', () => {
        it('should call onClick when clicked', async () => {
            const onClick = vi.fn();
            render(<SuggestionChip label="Why do stars shine?" onClick={onClick} />);
            await userEvent.click(screen.getByRole('button'));
            expect(onClick).toHaveBeenCalledOnce();
        });
    });

    describe('given disabled is true', () => {
        it('should render as a disabled button', () => {
            render(<SuggestionChip label="Why is the sky blue?" onClick={() => {}} disabled />);
            expect(screen.getByRole('button')).toBeDisabled();
        });

        it('should not call onClick when clicked', async () => {
            const onClick = vi.fn();
            render(<SuggestionChip label="Why is the sky blue?" onClick={onClick} disabled />);
            await userEvent.click(screen.getByRole('button'));
            expect(onClick).not.toHaveBeenCalled();
        });
    });
});

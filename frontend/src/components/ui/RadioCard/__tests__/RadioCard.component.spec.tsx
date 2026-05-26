import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RadioCard from '../RadioCard';

function renderCard(props?: React.ComponentProps<typeof RadioCard>): ReturnType<typeof render> {
    return render(<RadioCard title="Book" {...props} />);
}

describe('RadioCard', () => {
    describe('given default state', () => {
        it('should render a radio button', () => {
            renderCard();
            expect(screen.getByRole('radio')).toBeInTheDocument();
        });

        it('should not be checked by default', () => {
            renderCard();
            expect(screen.getByRole('radio')).not.toBeChecked();
        });
    });

    describe('given a title', () => {
        it('should display the title', () => {
            renderCard({ title: 'Comic' });
            expect(screen.getByText('Comic')).toBeInTheDocument();
        });
    });

    describe('given a description', () => {
        it('should display the description', () => {
            renderCard({ title: 'Book', description: 'One illustration per page' });
            expect(screen.getByText('One illustration per page')).toBeInTheDocument();
        });
    });

    describe('given selected', () => {
        it('should be checked', () => {
            renderCard({ title: 'Book', selected: true });
            expect(screen.getByRole('radio')).toBeChecked();
        });
    });

    describe('given disabled', () => {
        it('should render a disabled radio button', () => {
            renderCard({ title: 'Book', disabled: true });
            expect(screen.getByRole('radio')).toBeDisabled();
        });
    });

    describe('given an onChange handler', () => {
        it('should call onChange when clicked', async () => {
            const onChange = vi.fn();
            renderCard({ title: 'Book', onChange });
            await userEvent.click(screen.getByRole('radio'));
            expect(onChange).toHaveBeenCalledOnce();
        });

        it('should not call onChange when disabled', async () => {
            const onChange = vi.fn();
            renderCard({ title: 'Book', onChange, disabled: true });
            await userEvent.click(screen.getByRole('radio'));
            expect(onChange).not.toHaveBeenCalled();
        });
    });
});

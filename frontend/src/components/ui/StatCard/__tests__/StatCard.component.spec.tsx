import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard', () => {
    describe('given a value and label', () => {
        it('should display the metric value', () => {
            render(<StatCard value="7" label="STORIES THIS WEEK" />);
            expect(screen.getByText('7')).toBeInTheDocument();
        });

        it('should display the label', () => {
            render(<StatCard value="7" label="STORIES THIS WEEK" />);
            expect(screen.getByText('STORIES THIS WEEK')).toBeInTheDocument();
        });
    });

    describe('given info text', () => {
        it('should display the info line', () => {
            render(<StatCard value="7" label="STORIES THIS WEEK" info="↑ 2 from last week" />);
            expect(screen.getByText('↑ 2 from last week')).toBeInTheDocument();
        });
    });

    describe('given no info text', () => {
        it('should not render an info line', () => {
            render(<StatCard value="7" label="STORIES THIS WEEK" />);
            expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
        });
    });
});

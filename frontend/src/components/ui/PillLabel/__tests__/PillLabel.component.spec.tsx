import { render, screen } from '@testing-library/react';
import PillLabel from '../PillLabel';

describe('PillLabel', () => {
    describe('given no mark', () => {
        it('should render the default triangle mark', () => {
            render(<PillLabel>Featured</PillLabel>);

            expect(screen.getByText('▲')).toBeInTheDocument();
        });
    });

    describe('given an explicit mark', () => {
        it('should render the supplied mark unchanged', () => {
            render(<PillLabel mark="◆">Featured</PillLabel>);

            expect(screen.getByText('◆')).toBeInTheDocument();
            expect(screen.queryByText('▲')).not.toBeInTheDocument();
        });
    });
});

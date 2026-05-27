import { render, screen } from '@testing-library/react';
import BrandMark from '../BrandMark';

describe('BrandMark', () => {
    describe('given default props', () => {
        it('should render a link to the home page', () => {
            render(<BrandMark />);
            expect(screen.getByRole('link', { name: /tailortales/i })).toHaveAttribute('href', '/');
        });

        it('should display the brand name', () => {
            render(<BrandMark />);
            expect(screen.getByText('TailorTales')).toBeInTheDocument();
        });
    });
});

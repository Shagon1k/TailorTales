import { render, screen } from '@testing-library/react';
import BrandMark from '../BrandMark';

describe('BrandMark', () => {
    describe('given the default size', () => {
        it('should render a link to the home page', () => {
            render(<BrandMark />);
            expect(screen.getByRole('link', { name: /tailortales/i })).toHaveAttribute('href', '/');
        });

        it('should display the brand name', () => {
            render(<BrandMark />);
            expect(screen.getByText('TailorTales')).toBeInTheDocument();
        });
    });

    describe('given size="sm"', () => {
        it('should apply the sm modifier class', () => {
            render(<BrandMark size="sm" />);
            const link = screen.getByRole('link', { name: /tailortales/i });
            expect(link.className).toMatch(/m-sm/);
        });
    });

    describe('given size="lg"', () => {
        it('should apply the lg modifier class', () => {
            render(<BrandMark size="lg" />);
            const link = screen.getByRole('link', { name: /tailortales/i });
            expect(link.className).toMatch(/m-lg/);
        });
    });

    describe('given no size prop', () => {
        it('should not apply any size modifier class', () => {
            render(<BrandMark />);
            const link = screen.getByRole('link', { name: /tailortales/i });
            expect(link.className).not.toMatch(/m-sm/);
            expect(link.className).not.toMatch(/m-lg/);
        });
    });
});

import { render, screen } from '@testing-library/react';
import PageHero from '../PageHero';

describe('PageHero', () => {
    describe('given only a heading', () => {
        it('should render the heading as an h1', () => {
            render(<PageHero heading="Three small steps, one lasting tale." />);

            expect(
                screen.getByRole('heading', { level: 1, name: 'Three small steps, one lasting tale.' }),
            ).toBeInTheDocument();
        });
    });

    describe('given an eyebrow is provided', () => {
        it('should render the eyebrow text', () => {
            render(<PageHero heading="Test heading" eyebrow="· The workshop ·" />);

            expect(screen.getByText('· The workshop ·')).toBeInTheDocument();
        });
    });

    describe('given a sub is provided', () => {
        it('should render the subtext paragraph', () => {
            render(<PageHero heading="Test heading" sub="A short description of the page." />);

            expect(screen.getByText('A short description of the page.')).toBeInTheDocument();
        });
    });
});

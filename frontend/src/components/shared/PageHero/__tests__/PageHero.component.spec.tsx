import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import PageHero, { HeroHighlight } from '../PageHero';

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('PageHero', () => {
    describe('given only a heading', () => {
        it('should render the heading as an h1', () => {
            renderWithMantine(<PageHero heading="Three small steps, one lasting tale." />);

            expect(
                screen.getByRole('heading', {
                    level: 1,
                    name: 'Three small steps, one lasting tale.',
                }),
            ).toBeInTheDocument();
        });
    });

    describe('given an eyebrow is provided', () => {
        it('should render the eyebrow text', () => {
            renderWithMantine(<PageHero heading="Test heading" eyebrow="How it works" />);

            expect(screen.getByText('How it works')).toBeInTheDocument();
        });
    });

    describe('given a sub is provided', () => {
        it('should render the subtext paragraph', () => {
            renderWithMantine(
                <PageHero heading="Test heading" sub="A short description of the page." />,
            );

            expect(screen.getByText('A short description of the page.')).toBeInTheDocument();
        });
    });

    describe('given a heading with a HeroHighlight', () => {
        it('should render the highlighted words within the heading', () => {
            renderWithMantine(
                <PageHero
                    heading={
                        <>
                            Where their <HeroHighlight>questions</HeroHighlight>
                        </>
                    }
                />,
            );

            expect(screen.getByText('questions')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
                'Where their questions',
            );
        });
    });

    describe('given children are provided', () => {
        it('should render the children below the hero', () => {
            renderWithMantine(
                <PageHero heading="Test heading">
                    <button type="button">Action</button>
                </PageHero>,
            );

            expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
        });
    });
});

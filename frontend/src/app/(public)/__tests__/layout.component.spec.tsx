import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import PublicLayout from '../layout';

function renderWithMantine(ui: React.ReactElement): ReturnType<typeof render> {
    return render(<MantineProvider>{ui}</MantineProvider>);
}

describe('PublicLayout', () => {
    describe('given any children', () => {
        it('should render children inside a main landmark', () => {
            renderWithMantine(
                <PublicLayout>
                    <div>Page content</div>
                </PublicLayout>,
            );

            const main = screen.getByRole('main');
            expect(main).toBeInTheDocument();
            expect(main).toHaveTextContent('Page content');
        });

        it('should render a header landmark', () => {
            renderWithMantine(
                <PublicLayout>
                    <div>Page content</div>
                </PublicLayout>,
            );

            expect(screen.getByRole('banner')).toBeInTheDocument();
        });

        it('should render a footer landmark', () => {
            renderWithMantine(
                <PublicLayout>
                    <div>Page content</div>
                </PublicLayout>,
            );

            expect(screen.getByRole('contentinfo')).toBeInTheDocument();
        });
    });
});

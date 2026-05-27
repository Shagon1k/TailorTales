import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Link from '../Link';

function renderLink(props: React.ComponentProps<typeof Link> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Link href="/test" {...props}>
                Read more
            </Link>
        </MantineProvider>,
    );
}

describe('Link', () => {
    describe('given default props', () => {
        it('should render an accessible link', () => {
            renderLink();
            expect(screen.getByRole('link', { name: /read more/i })).toBeInTheDocument();
        });

        it('should render children as label', () => {
            renderLink();
            expect(screen.getByText('Read more')).toBeInTheDocument();
        });
    });

    describe('given href prop', () => {
        it('should render with the correct href', () => {
            renderLink({ href: '/stories' });
            expect(screen.getByRole('link', { name: /read more/i })).toHaveAttribute(
                'href',
                '/stories',
            );
        });
    });
});

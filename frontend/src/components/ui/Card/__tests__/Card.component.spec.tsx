import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Card from '../Card';

function renderCard(props: React.ComponentProps<typeof Card> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Card {...props}>Content</Card>
        </MantineProvider>,
    );
}

describe('Card', () => {
    describe('given default props', () => {
        it('should render children', () => {
            renderCard();
            expect(screen.getByText('Content')).toBeInTheDocument();
        });
    });
});

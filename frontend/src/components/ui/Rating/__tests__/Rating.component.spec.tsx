import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Rating from '../Rating';

function renderRating(props: React.ComponentProps<typeof Rating> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Rating {...props} />
        </MantineProvider>,
    );
}

describe('Rating', () => {
    describe('given default props', () => {
        it('should render interactive radio inputs', () => {
            renderRating();
            expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
        });
    });

    describe('given readOnly', () => {
        it('should not render radio inputs', () => {
            renderRating({ readOnly: true, value: 3 });
            expect(screen.queryByRole('radio')).not.toBeInTheDocument();
        });
    });
});

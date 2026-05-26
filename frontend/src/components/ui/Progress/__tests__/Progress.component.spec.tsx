import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Progress from '../Progress';

function renderProgress(props: React.ComponentProps<typeof Progress>): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Progress {...props} />
        </MantineProvider>,
    );
}

describe('Progress', () => {
    describe('given a value', () => {
        it('should render a progressbar role', () => {
            renderProgress({ value: 50 });
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('should reflect the current value via aria-valuenow', () => {
            renderProgress({ value: 75 });
            expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
        });
    });
});

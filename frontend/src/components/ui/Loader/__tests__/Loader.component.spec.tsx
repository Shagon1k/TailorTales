import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Loader from '../Loader';

function renderLoader(props: React.ComponentProps<typeof Loader> = {}): void {
    render(
        <MantineProvider env="test">
            <Loader {...props} />
        </MantineProvider>,
    );
}

describe('Loader', () => {
    it('should expose a default accessible label', () => {
        renderLoader();

        expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    });

    it('should use a custom label when provided', () => {
        renderLoader({ label: 'Loading users' });

        expect(screen.getByLabelText('Loading users')).toBeInTheDocument();
    });
});

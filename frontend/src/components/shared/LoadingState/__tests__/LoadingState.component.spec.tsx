import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import LoadingState from '../LoadingState';

function renderLoadingState(props: React.ComponentProps<typeof LoadingState>): void {
    render(
        <MantineProvider env="test">
            <LoadingState {...props} />
        </MantineProvider>,
    );
}

describe('LoadingState', () => {
    it('should expose a polite loading status without marking that status busy', () => {
        // Arrange
        const label = 'Loading your subscription';

        // Act
        renderLoadingState({ label });

        // Assert
        expect(screen.getByRole('status')).not.toHaveAttribute('aria-busy');
        expect(screen.getByText(label)).toBeInTheDocument();
    });

    it('should show its label visually when requested', () => {
        // Arrange
        const label = 'Activating your subscription';

        // Act
        renderLoadingState({ label, showLabel: true });

        // Assert
        expect(screen.getByText(label)).toBeVisible();
    });
});

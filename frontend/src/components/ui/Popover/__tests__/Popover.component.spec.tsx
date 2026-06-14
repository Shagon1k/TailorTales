import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import Popover from '../Popover';

function ControlledPopover(): React.ReactElement {
    const [opened, setOpened] = useState(false);
    return (
        <Popover
            opened={opened}
            onChange={setOpened}
            target={
                <button type="button" onClick={() => setOpened((value) => !value)}>
                    Open
                </button>
            }
        >
            <p>Dropdown content</p>
        </Popover>
    );
}

function renderPopover(): void {
    render(
        <MantineProvider env="test">
            <ControlledPopover />
        </MantineProvider>,
    );
}

describe('Popover', () => {
    describe('given a target', () => {
        it('should render the trigger', () => {
            renderPopover();
            expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
        });

        it('should not show the dropdown content until opened', () => {
            renderPopover();
            expect(screen.queryByText('Dropdown content')).not.toBeInTheDocument();
        });
    });

    describe('when the target is activated', () => {
        it('should reveal the dropdown content', async () => {
            renderPopover();

            await userEvent.click(screen.getByRole('button', { name: 'Open' }));

            expect(await screen.findByText('Dropdown content')).toBeInTheDocument();
        });
    });
});

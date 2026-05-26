import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Tag from '../Tag';

function renderTag(props: React.ComponentProps<typeof Tag> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Tag {...props}>Fantasy</Tag>
        </MantineProvider>,
    );
}

describe('Tag', () => {
    describe('given default props', () => {
        it('should render with content', () => {
            renderTag();
            expect(screen.getByText('Fantasy')).toBeInTheDocument();
        });
    });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import Avatar from '../Avatar';

function renderAvatar(props: React.ComponentProps<typeof Avatar> = {}): ReturnType<typeof render> {
    return render(
        <MantineProvider>
            <Avatar {...props} />
        </MantineProvider>,
    );
}

describe('Avatar', () => {
    describe('given src and alt', () => {
        it('should render an accessible image', () => {
            renderAvatar({ src: '/avatar.jpg', alt: 'Alice' });
            expect(screen.getByRole('img', { name: /alice/i })).toBeInTheDocument();
        });

        it('should use the provided src', () => {
            renderAvatar({ src: '/avatar.jpg', alt: 'Alice' });
            expect(screen.getByRole('img', { name: /alice/i })).toHaveAttribute(
                'src',
                '/avatar.jpg',
            );
        });

        it('should fall back to initials when the image fails to load', async () => {
            renderAvatar({ src: '/broken-avatar.jpg', alt: 'Alice', name: 'Alice Baker' });

            const image = screen.getByRole('img', { name: /alice/i });
            fireEvent.error(image);

            expect(screen.getByText('AB')).toBeInTheDocument();
        });
    });
});

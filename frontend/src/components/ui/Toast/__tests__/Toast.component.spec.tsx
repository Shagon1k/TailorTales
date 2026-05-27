import { render, screen } from '@testing-library/react';
import Toast from '../Toast';

function renderToast(props: React.ComponentProps<typeof Toast>): ReturnType<typeof render> {
    return render(<Toast {...props} />);
}

describe('Toast', () => {
    describe('given a message', () => {
        it('should render an alert', () => {
            renderToast({ children: 'Something happened' });
            expect(screen.getByRole('alert')).toBeInTheDocument();
        });

        it('should display the message', () => {
            renderToast({ children: 'File saved successfully' });
            expect(screen.getByText('File saved successfully')).toBeInTheDocument();
        });
    });

    describe('given a title', () => {
        it('should display the title', () => {
            renderToast({ title: 'Success', children: 'Your changes were saved' });
            expect(screen.getByText('Success')).toBeInTheDocument();
        });
    });

    describe('given a custom icon', () => {
        it('should render the custom icon', () => {
            renderToast({ icon: <span>custom-icon</span>, children: 'Done' });
            expect(screen.getByText('custom-icon')).toBeInTheDocument();
        });
    });
});

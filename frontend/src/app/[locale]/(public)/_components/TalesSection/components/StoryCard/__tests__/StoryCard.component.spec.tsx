import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { NextIntlClientProvider } from 'next-intl';
import StoryCard from '../StoryCard';

vi.mock('@/components/ui/Modal/Modal', () => ({
    default: ({
        opened,
        title,
        children,
    }: {
        opened: boolean;
        title: React.ReactNode;
        children: React.ReactNode;
    }) =>
        opened ? (
            <div>
                <h2>{title}</h2>
                {children}
            </div>
        ) : null,
}));

const messages = {
    home: {
        tales: {
            card: {
                meta: 'age {age} · {pages} pages',
                comicSuffix: ' · comic',
                untitled: 'Untitled tale',
                previewButton: 'Peek inside',
                previewPdfLink: 'Preview sample PDF',
                details: {
                    age: 'Reader age',
                    ageValue: '{age} years old',
                    format: 'Format',
                    pages: 'Length',
                    language: 'Language',
                    genre: 'Genre',
                    writingStyle: 'Writing style',
                    artStyle: 'Art style',
                    hero: 'Recurring hero',
                },
                formats: { book: 'Book', comic: 'Comic' },
                hero: { selected: 'Character selected', none: 'No fixed hero' },
                genres: {
                    fairyTale: 'Fairy tale',
                    bedtime: 'Bedtime',
                    educational: 'Educational',
                    adventure: 'Adventure',
                },
                writingStyles: {
                    simple: 'Simple',
                    poetic: 'Poetic',
                    imaginative: 'Imaginative',
                },
            },
        },
    },
} as const;

function renderCard(): void {
    render(
        <NextIntlClientProvider locale="en" messages={messages}>
            <MantineProvider>
                <StoryCard
                    title={null}
                    quote="Why is the sky blue?"
                    age={6}
                    pages={12}
                    language="EN"
                    genre="EDUCATIONAL"
                    writingStyle="SIMPLE"
                    artStyleName="Watercolour"
                    hasCharacter={false}
                    pdfUrl="https://example.com/story.pdf"
                    format="book"
                    rating={5}
                    tone="fox"
                />
            </MantineProvider>
        </NextIntlClientProvider>,
    );
}

describe('StoryCard', () => {
    it('should show public-safe meta without a child name', () => {
        renderCard();

        expect(screen.getByText('age 6 · 12 pages')).toBeInTheDocument();
        expect(screen.queryByText(/Maya/i)).not.toBeInTheDocument();
    });

    it('should open a preview modal with story settings and the PDF link', async () => {
        renderCard();

        await userEvent.click(screen.getByRole('button', { name: /peek inside/i }));

        expect(screen.getAllByText(/why is the sky blue/i)).toHaveLength(2);
        expect(screen.getByText('Educational')).toBeInTheDocument();
        expect(screen.getByText('Watercolour')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /preview sample pdf/i })).toHaveAttribute(
            'href',
            'https://example.com/story.pdf',
        );
    });
});

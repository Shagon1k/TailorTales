import type { StoryGenre, WritingStyle } from '../../../generated/prisma/client.js';
import { StoryPromptBuilder } from '../story-prompt-builder.js';

/**
 * buildUserPrompt has no dependencies — instantiate directly.
 * The object literal is passed inline so each field is contextually typed
 * against IPromptContext (e.g. `language: 'EN'` checks against Language).
 */
function buildPrompt(interests: string[]): string {
    return buildPromptWith({ interests });
}

function buildPromptWith(opts: {
    interests?: string[];
    genre?: StoryGenre | null;
    writingStyle?: WritingStyle | null;
    character?: { name: string; description: string } | null;
    gender?: 'MALE' | 'FEMALE';
    pageCount?: number;
}): string {
    const builder = new StoryPromptBuilder();
    return builder.buildUserPrompt({
        child: {
            name: 'Maya',
            birthdate: new Date('2019-01-01'),
            gender: opts.gender ?? 'FEMALE',
            interests: opts.interests ?? [],
        },
        artStyle: { promptPrefix: 'Warm watercolour style.' },
        blueprint: { systemPrompt: "You write warm children's books." },
        question: 'Why do mountains breathe smoke?',
        pageCount: opts.pageCount ?? 5,
        language: 'EN',
        character: opts.character ?? undefined,
        genre: opts.genre,
        writingStyle: opts.writingStyle,
    });
}

describe('StoryPromptBuilder', () => {
    describe('buildUserPrompt', () => {
        describe('given the reader has interests', () => {
            it('should include them as an optional, non-forcing inspiration hint', () => {
                // Arrange + Act
                const prompt = buildPrompt(['dinosaurs', 'football']);

                // Assert — listed as inspiration, explicitly not mandatory
                expect(prompt).toContain('optional inspiration');
                expect(prompt).toContain('dinosaurs, football');
                expect(prompt).toContain('Never force them');
            });
        });

        describe('given the reader has no interests', () => {
            it('should omit the interests section entirely', () => {
                // Arrange + Act
                const prompt = buildPrompt([]);

                // Assert
                expect(prompt).not.toContain('optional inspiration');
                expect(prompt).not.toContain('INTERESTS');
            });
        });

        describe('given a genre is selected', () => {
            it('should inject the matching genre fragment', () => {
                // Arrange + Act
                const prompt = buildPromptWith({ genre: 'FAIRY_TALE' });

                // Assert
                expect(prompt).toContain('GENRE:');
                expect(prompt).toContain('fairy tale');
            });
        });

        describe('given a writing style is selected', () => {
            it('should inject the matching writing-style fragment', () => {
                // Arrange + Act
                const prompt = buildPromptWith({ writingStyle: 'POETIC' });

                // Assert
                expect(prompt).toContain('WRITING STYLE:');
                expect(prompt).toContain('rhyming');
            });
        });

        describe('given neither genre nor writing style is set', () => {
            it('should omit both sections', () => {
                // Arrange + Act
                const prompt = buildPromptWith({});

                // Assert
                expect(prompt).not.toContain('GENRE:');
                expect(prompt).not.toContain('WRITING STYLE:');
            });
        });

        describe('given no character is selected', () => {
            it('should keep the child as audience-only and forbid turning them into the hero by default', () => {
                const prompt = buildPromptWith({});

                expect(prompt).toContain('The intended reader is Maya, a girl aged 7.');
                expect(prompt).toContain('The child is the audience for the book');
                expect(prompt).toContain(
                    'If no CHARACTER section is present, do NOT turn the child into the hero.',
                );
                expect(prompt).not.toContain('CHARACTER (recurring visual identity');
            });
        });

        describe('given the reader gender is known', () => {
            it('should include it as audience-targeting context', () => {
                const prompt = buildPromptWith({ gender: 'MALE' });

                expect(prompt).toContain('The intended reader is Maya, a boy aged 7.');
                expect(prompt).toContain(
                    'Use age and gender only to tune clarity, pacing, emotional tone, and relatable details for the audience.',
                );
            });
        });

        describe('given a character is selected', () => {
            it('should state that the selected character is the recurring hero', () => {
                const prompt = buildPromptWith({
                    character: {
                        name: 'Foxy Blue',
                        description: 'A small blue fox in a green top hat.',
                    },
                });

                expect(prompt).toContain('CHARACTER (recurring visual identity');
                expect(prompt).toContain('Foxy Blue: A small blue fox in a green top hat.');
                expect(prompt).toContain('This character is the main hero of the story.');
            });
        });

        describe('given a story can use multiple interior templates', () => {
            it('should explicitly ask for layout variety and describe interior templates from config', () => {
                const prompt = buildPromptWith({});

                expect(prompt).toContain(
                    'Do not default every interior page to the same template.',
                );
                expect(prompt).toContain(
                    'For stories with 5 or more pages, use at least two different interior templates',
                );
                expect(prompt).toContain(
                    'Use layout changes to support pacing and emotional rhythm',
                );
                expect(prompt).toContain('INTERIOR TEMPLATE USAGE GUIDE:');
                expect(prompt).toContain(
                    'book-text-image: Steady mixed layout with prose first and a landscape illustration in the lower half.',
                );
                expect(prompt).toContain(
                    'book-image-top: Image-first mixed layout with a landscape illustration at the top and prose below.',
                );
                expect(prompt).toContain(
                    'book-image-middle: Balanced middle-image layout with short prose above and below the illustration.',
                );
                expect(prompt).toContain('book-full-image: Use for high-impact visual moments');
                expect(prompt).toContain(
                    'book-text: Use for narrative bridges or emotional beats that need no illustration.',
                );
            });
        });

        describe('given a longer story needs more visual rhythm', () => {
            it('should ask for stronger layout distribution across the whole book', () => {
                const prompt = buildPromptWith({ pageCount: 12 });

                expect(prompt).toContain('LAYOUT DISTRIBUTION:');
                expect(prompt).toContain(
                    'Use at least one non-default interior layout so the book does not feel mechanically repetitive.',
                );
                expect(prompt).toContain(
                    'Avoid using "book-text-image", "book-image-top" more than 2 times in a row',
                );
                expect(prompt).toContain(
                    'When a page begins with a strong visual reveal or a new scene, prefer an image-first default layout over a text-led one.',
                );
                expect(prompt).toContain(
                    'include at least 2 meaningful "book-full-image" moments at different parts of the story',
                );
                expect(prompt).toContain(
                    'vary pacing across beginning, middle, and ending so the layout rhythm evolves with the story',
                );
                expect(prompt).toContain(
                    'combine scene-setting pages, text-led explanation pages, visually centered transition pages',
                );
            });
        });
    });
});

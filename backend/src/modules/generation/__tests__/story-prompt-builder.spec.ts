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
}): string {
    const builder = new StoryPromptBuilder();
    return builder.buildUserPrompt({
        child: { name: 'Maya', birthdate: new Date('2019-01-01'), interests: opts.interests ?? [] },
        artStyle: { promptPrefix: 'Warm watercolour style.' },
        blueprint: { systemPrompt: "You write warm children's books." },
        question: 'Why do mountains breathe smoke?',
        pageCount: 5,
        language: 'EN',
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
    });
});

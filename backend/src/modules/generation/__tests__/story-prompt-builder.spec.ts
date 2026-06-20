import { StoryPromptBuilder } from '../story-prompt-builder.js';

/**
 * buildUserPrompt has no dependencies — instantiate directly.
 * The object literal is passed inline so each field is contextually typed
 * against IPromptContext (e.g. `language: 'EN'` checks against Language).
 */
function buildPrompt(interests: string[]): string {
    const builder = new StoryPromptBuilder();
    return builder.buildUserPrompt({
        child: { name: 'Maya', birthdate: new Date('2019-01-01'), interests },
        artStyle: { promptPrefix: 'Warm watercolour style.' },
        blueprint: { systemPrompt: "You write warm children's books." },
        question: 'Why do mountains breathe smoke?',
        pageCount: 5,
        language: 'EN',
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
    });
});

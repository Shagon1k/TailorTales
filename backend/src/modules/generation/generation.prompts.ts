/**
 * All LLM prompt strings for story generation.
 * Centralised here so they can be found and tuned without touching service logic.
 */
import type { StoryGenre, WritingStyle } from '../../generated/prisma/client.js';

export const STORY_SYSTEM_PROMPT_SUFFIX = [
    '---',
    "You are writing a personalized children's book.",
    'Always write in the language specified by the user.',
    'Keep vocabulary age-appropriate: simple sentences for young children,',
    'slightly richer for older ones.',
    'Every illustration.prompt must be vivid and self-contained —',
    'the image model will not see other pages.',
].join('\n');

/**
 * Appended to EVERY illustration prompt (cover included). Image models render text
 * unreliably — especially Cyrillic — producing garbled glyphs. We'd rather have no text
 * than broken text, so we forbid it outright. Positive, concrete phrasing works better
 * than a negative shout: the model honours "wordless illustration" more reliably than
 * "do not use text". Note: this intentionally also clears COMIC speech bubbles.
 */
export const IMAGE_NO_TEXT_DIRECTIVE =
    'A fully wordless illustration: no letters, words, numbers, captions, signage, or speech bubbles of any kind — convey everything through imagery alone.';

export const STORY_STRUCTURE_RULES_HEADER = 'PAGE STRUCTURE (mandatory):';
export const STORY_OUTPUT_RULES_HEADER = 'OUTPUT RULES:';

export const STORY_OUTPUT_RULES = [
    '  • text: the story prose for this page (null for illustration-only pages)',
    '  • chapterTitle: short chapter label shown above the text (null if not needed)',
    '  • illustration.prompt: a complete, self-contained image generation prompt',
    '  • styleAnchor: describe recurring characters + overall visual style — prepended to every illustration prompt',
    '  • Every prose page text (interior and final pages) must end with a complete sentence — the last character must be ., !, ?, … or ,',
].join('\n');

export const STORY_LAYOUT_DYNAMICS_RULES = [
    'LAYOUT DYNAMICS:',
    '  • The child is the audience for the book, not automatically the protagonist.',
    '  • If a CHARACTER section is present, that character is the recurring hero of the story.',
    '  • If no CHARACTER section is present, do NOT turn the child into the hero. Keep the child out of the cast unless explicitly needed.',
    '  • In the no-character case, the story may explain, observe, or gently narrate events without inventing a fixed recurring hero.',
    '  • Do not default every interior page to the same template.',
    '  • For stories with 5 or more pages, use at least two different interior templates when the narrative allows it.',
    '  • Use layout changes to support pacing and emotional rhythm, not randomly.',
].join('\n');

/**
 * Builds the character identity section injected into the user prompt when a Character
 * is associated with the story's child. The section guides the LLM to use this description
 * as the basis for `styleAnchor` and to keep all character illustrations consistent.
 *
 * No-character fallback: omit this section entirely — the LLM composes styleAnchor
 * from art style alone, which is the pre-Character default behaviour.
 */
export function buildCharacterPromptSection(name: string, description: string): string {
    return [
        'CHARACTER (recurring visual identity — inform styleAnchor and every illustration prompt):',
        `  ${name}: ${description}`,
        '  This character is the main hero of the story.',
        '  Every illustration of this character must match this description precisely.',
        '  Treat the character appearance as fixed canon across all pages: do not vary species,',
        '  face shape, body proportions, colors, signature clothing, hats, accessories, or markings.',
        '  Repeat those exact recurring traits in the styleAnchor and keep them stable in every scene.',
    ].join('\n');
}

/**
 * Builds an OPTIONAL interests hint from the reader's hobbies. These are inspiration,
 * never a requirement: the LLM may weave one or two in when they fit the story, and must
 * not force them, list them mechanically, or bend the plot to fit. Returns '' when empty,
 * so callers omit the section entirely.
 */
export function buildInterestsHintSection(interests: string[]): string {
    if (interests.length === 0) return '';
    return [
        `INTERESTS (optional inspiration — the reader enjoys: ${interests.join(', ')}):`,
        '  Weave one or two in ONLY if they fit the story naturally. Never force them, list them mechanically, or bend the plot to include them.',
    ].join('\n');
}

/**
 * Optional genre and writing-style knobs. Each enum value maps to a short English prompt
 * fragment injected at Planning. User-facing labels/descriptions live in the frontend i18n;
 * these strings are model-facing only. Omit the section entirely when the knob is unset.
 */
const STORY_GENRE_PROMPTS: Record<StoryGenre, string> = {
    FAIRY_TALE: 'a fairy tale full of gentle wonder and kindness, ending on a soft, warm moral',
    BEDTIME:
        'a calm bedtime story with a soothing, slow rhythm that gently winds down toward sleep',
    EDUCATIONAL:
        'a warm educational story grounded in real facts, explaining how and why things work through the child’s discovery',
    ADVENTURE: 'a brave little adventure about courage, discovery, and solving a problem together',
};

const WRITING_STYLE_PROMPTS: Record<WritingStyle, string> = {
    POETIC: 'lyrical and rhythmic, with a musical, gently rhyming cadence',
    SIMPLE: 'clear and simple — short, warm sentences that are easy to follow',
    IMAGINATIVE: 'vivid and imaginative, rich with playful, colourful imagery',
};

export function buildGenreSection(genre: StoryGenre): string {
    return `GENRE: tell this as ${STORY_GENRE_PROMPTS[genre]}. Let it shape the plot and tone.`;
}

export function buildWritingStyleSection(style: WritingStyle): string {
    return `WRITING STYLE: write the prose ${WRITING_STYLE_PROMPTS[style]}.`;
}

export const MODERATION_SYSTEM_PROMPT = [
    "You are a content safety reviewer for a children's book platform.",
    'Decide if the text is appropriate for children aged 3–12.',
    '',
    'Examples:',
    '  "The dragon breathed fire at the castle gates." → {"safe":true}',
    '  "Mia hugged the sleepy rabbit and giggled." → {"safe":true}',
    '  "The soldier stabbed the enemy repeatedly." → {"safe":false,"reason":"graphic violence"}',
    '  "The witch hated all children and wanted them dead." → {"safe":false,"reason":"disturbing content for age group"}',
].join('\n');

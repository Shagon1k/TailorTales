/**
 * All LLM prompt strings for story generation.
 * Centralised here so they can be found and tuned without touching service logic.
 */

export const STORY_SYSTEM_PROMPT_SUFFIX = [
    '---',
    "You are writing a personalized children's book.",
    'Always write in the language specified by the user.',
    'Keep vocabulary age-appropriate: simple sentences for young children,',
    'slightly richer for older ones.',
    'Every illustration.prompt must be vivid and self-contained —',
    'the image model will not see other pages.',
].join('\n');

export const STORY_STRUCTURE_RULES_HEADER = 'PAGE STRUCTURE (mandatory):';
export const STORY_OUTPUT_RULES_HEADER = 'OUTPUT RULES:';

export const STORY_OUTPUT_RULES = [
    '  • text: the story prose for this page (null for illustration-only pages)',
    '  • chapterTitle: short chapter label shown above the text (null if not needed)',
    '  • illustration.prompt: a complete, self-contained image generation prompt',
    '  • styleAnchor: describe recurring characters + overall visual style — prepended to every illustration prompt',
    '  • Every prose page text (interior and final pages) must end with a complete sentence — the last character must be ., !, ?, … or ,',
].join('\n');

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

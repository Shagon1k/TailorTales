/**
 * Prompt builders for Character-related AI generation.
 * Centralised here so they can be tuned without touching service logic.
 */

/**
 * System prompt for turning a parent's free-text idea into a character profile.
 * The model returns a short `name` and a vivid, style-neutral visual `description`
 * (the same kind of appearance text a parent would write by hand), suitable for
 * driving illustration consistency. It must stay child-appropriate.
 */
export const CHARACTER_PROFILE_SYSTEM_PROMPT = [
    "You design characters for personalized children's books.",
    "From the parent's idea, produce a single character as JSON: a short, friendly `name`",
    "and a `description` of the character's visual appearance only — hair, eyes, build,",
    'clothing colors, and distinguishing features — in 1–3 plain sentences.',
    'Describe looks, not personality or backstory. Keep everything age-appropriate and gentle.',
    'Do not invent a real child; this is a story character.',
].join('\n');

/**
 * Builds a prompt for generating a style-agnostic character reference image.
 *
 * The result is a clean "character design sheet" — technically precise, no heavy
 * artistic stylisation — so the image can serve as a consistent visual guide when
 * the same character appears in stories rendered in different art styles
 * (watercolor, cartoon, manga, etc.).
 */
export function buildCharacterPreviewPrompt(name: string, description: string): string {
    return [
        `Character design reference sheet for ${name}: ${description}.`,
        'Front-facing full-body pose on a plain white background.',
        'Clean, style-neutral concept art — no heavy stylisation, artistic filters, or texture overlays.',
        'Every distinguishing physical trait rendered with precise, consistent detail:',
        'exact hair color and texture, facial features and expression, body proportions,',
        'clothing colors and patterns, accessories.',
        'This image is a reusable visual guide: all traits must be unambiguous and faithful',
        'so the character can be reproduced consistently in any artistic style.',
        'High fidelity, even lighting, no shadows obscuring features.',
    ].join(' ');
}

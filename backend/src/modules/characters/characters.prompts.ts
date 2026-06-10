/**
 * Prompt builders for Character-related AI generation.
 * Centralised here so they can be tuned without touching service logic.
 */

/**
 * Builds a prompt for generating a style-agnostic character reference image.
 *
 * The result is a clean "character design sheet" — technically precise, no heavy
 * artistic stylisation — so the image can serve as a consistent visual guide when
 * the same character appears in stories rendered in different art styles
 * (watercolor, cartoon, manga, etc.).
 */
export function buildCharacterPreviewPrompt(description: string): string {
    return [
        `Character design reference sheet: ${description}.`,
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

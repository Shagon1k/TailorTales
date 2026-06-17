export const GENERATION_QUEUE = 'generation';

/** Max parallel image generations per story. I/O-bound so 3-4 is safe. */
export const IMAGE_CONCURRENCY = 3;

/** Estimated characters per token by language — used to compute max_tokens ceiling. */
export const CHARS_PER_TOKEN = { EN: 4, RU: 2, DE: 4 } as const;

/** Conservative average story text chars per page across all templates. */
const AVG_CHARS_PER_PAGE = 300;
/** Extra budget for JSON wrapper, title, styleAnchor. */
const JSON_OVERHEAD_CHARS = 600;
/** Safety multiplier over the estimate. */
const TOKEN_SAFETY_MULTIPLIER = 2.5;
/** Hard cap to prevent runaway spend. */
const MAX_TOKENS_CAP = 8000;

export function computeMaxTokens(
    pageCount: number,
    language: keyof typeof CHARS_PER_TOKEN,
): number {
    const estimatedChars = pageCount * AVG_CHARS_PER_PAGE + JSON_OVERHEAD_CHARS;
    const raw = Math.ceil((estimatedChars / CHARS_PER_TOKEN[language]) * TOKEN_SAFETY_MULTIPLIER);
    return Math.min(raw, MAX_TOKENS_CAP);
}

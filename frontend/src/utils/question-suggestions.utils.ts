export const QUESTION_SUGGESTION_COUNT = 6;

const QUESTION_SUGGESTION_KEYS = [
    'moonFollows',
    'beesFindFlowers',
    'rainGoes',
    'skyBlue',
    'deepestSea',
    'seedKnowsUp',
    'starsTwinkle',
    'leavesChangeColor',
    'catsPurr',
    'windInvisible',
    'spidersSpinWebs',
    'cloudsFloat',
    'owlsAwakeAtNight',
    'snailsCarryHomes',
    'echoComesBack',
    'iceSlippery',
] as const;

type TQuestionSuggestionKey = (typeof QUESTION_SUGGESTION_KEYS)[number];

export function getLocalizedQuestionSuggestions(
    t: (key: `questionInput.suggestions.${TQuestionSuggestionKey}`) => string,
): string[] {
    return QUESTION_SUGGESTION_KEYS.map((key) => t(`questionInput.suggestions.${key}`));
}

export function getRandomQuestionSuggestions(
    suggestions: readonly string[],
    count: number = QUESTION_SUGGESTION_COUNT,
): string[] {
    const shuffled = [...suggestions];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(count, shuffled.length));
}

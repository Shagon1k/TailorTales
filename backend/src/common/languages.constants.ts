import type { Language } from '../generated/prisma/client.js';

/** Maps Language enum value to its English name — used in LLM prompts. */
export const LANGUAGE_NAMES: Record<Language, string> = {
    EN: 'English',
    RU: 'Russian',
    DE: 'German',
};

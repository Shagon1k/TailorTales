import type { Gender, Language } from '../generated/prisma/client.js';

/** Maps Language enum value to its English name — used in LLM prompts. */
export const LANGUAGE_NAMES: Record<Language, string> = {
    EN: 'English',
    RU: 'Russian',
    DE: 'German',
};

/** Maps Gender enum value to an audience noun used in LLM prompts. */
export const GENDER_AUDIENCE_NAMES: Record<Gender, string> = {
    MALE: 'boy',
    FEMALE: 'girl',
};

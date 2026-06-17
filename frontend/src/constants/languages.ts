import type { ILanguage } from '@/types/story.types';

export interface ILanguageMeta {
    /** The language's name written in that language — used in selectors and switchers. */
    nativeName: string;
    /** BCP-47 locale code — used for next-intl routing and Paddle checkout locale. */
    localeCode: string;
}

export const LANGUAGES: Record<ILanguage, ILanguageMeta> = {
    EN: { nativeName: 'English', localeCode: 'en' },
    RU: { nativeName: 'Русский', localeCode: 'ru' },
    DE: { nativeName: 'Deutsch', localeCode: 'de' },
};

/** Ordered list of supported language codes — drives selectors and route config. */
export const LANGUAGE_CODES: ILanguage[] = Object.keys(LANGUAGES) as ILanguage[];

/** Maps a BCP-47 locale code back to its ILanguage value. */
export const LOCALE_TO_LANGUAGE: Record<string, ILanguage> = {
    en: 'EN',
    ru: 'RU',
    de: 'DE',
};

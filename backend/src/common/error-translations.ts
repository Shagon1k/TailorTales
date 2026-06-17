export type ILocale = 'en' | 'de' | 'ru';
export const SUPPORTED_LOCALES: readonly ILocale[] = ['en', 'de', 'ru'];

/** Params bag for parameterized error messages. */
export interface IErrorParams {
    [key: string]: string | number;
}

/** Pass this as the HttpException response body for parameterized errors. */
export interface ILocalizedErrorBody {
    code: string;
    params?: IErrorParams;
}

type ITranslation = string | ((p: IErrorParams) => string);

type ITranslationEntry = Record<ILocale, ITranslation>;

const translations: Record<string, ITranslationEntry> = {
    'errors.unknown': {
        en: 'An unexpected error occurred.',
        de: 'Ein unerwarteter Fehler ist aufgetreten.',
        ru: 'Произошла непредвиденная ошибка.',
    },
    'errors.quota.pageCreditsExceeded': {
        en: (p) =>
            `This story needs ${p['cost']} credits but only ${p['remaining']} of ${p['limit']} are left this month.`,
        de: (p) =>
            `Diese Geschichte benötigt ${p['cost']} Credits, aber nur noch ${p['remaining']} von ${p['limit']} sind diesen Monat verfügbar.`,
        ru: (p) =>
            `Для этой истории нужно ${p['cost']} кредитов, а до конца месяца осталось только ${p['remaining']} из ${p['limit']}.`,
    },
    'errors.quota.regenerationsExceeded': {
        en: (p) => `Monthly regeneration limit of ${p['limit']} has been reached.`,
        de: (p) => `Das monatliche Regenerierungslimit von ${p['limit']} wurde erreicht.`,
        ru: (p) => `Достигнут месячный лимит регенерации: ${p['limit']} раз.`,
    },
    'errors.ratings.storyNotCompleted': {
        en: 'Only completed stories can be rated.',
        de: 'Nur abgeschlossene Geschichten können bewertet werden.',
        ru: 'Оценивать можно только завершённые истории.',
    },
    'errors.auth.accountSuspended': {
        en: 'Account suspended.',
        de: 'Konto gesperrt.',
        ru: 'Аккаунт заблокирован.',
    },
    'errors.billing.noActiveSubscription': {
        en: 'No paid subscription to cancel.',
        de: 'Kein bezahltes Abonnement zum Kündigen vorhanden.',
        ru: 'Нет платной подписки для отмены.',
    },
    'errors.billing.noBillingProfile': {
        en: 'No billing profile for this account.',
        de: 'Kein Abrechnungsprofil für dieses Konto vorhanden.',
        ru: 'Нет платёжного профиля для этого аккаунта.',
    },
    'errors.regeneration.storyNotCompleted': {
        en: 'Only completed stories can have pages regenerated.',
        de: 'Nur abgeschlossene Geschichten können neu generiert werden.',
        ru: 'Регенерация страниц доступна только для завершённых историй.',
    },
    'errors.characters.duplicateCharacter': {
        en: 'A character already exists for this child.',
        de: 'Für dieses Kind existiert bereits eine Figur.',
        ru: 'Для этого ребёнка уже существует персонаж.',
    },
};

export function resolveLocale(acceptLanguage: string | undefined): ILocale {
    if (!acceptLanguage) return 'en';
    const tags = acceptLanguage
        .split(',')
        .map((part) => part.trim().split(';')[0].trim().slice(0, 2).toLowerCase());
    for (const tag of tags) {
        const found = SUPPORTED_LOCALES.find((l) => l === tag);
        if (found) return found;
    }
    return 'en';
}

export function translate(
    code: string,
    locale: ILocale,
    params?: IErrorParams,
): string | undefined {
    const entry = translations[code];
    if (!entry) return undefined;
    const t = entry[locale] ?? entry['en'];
    return typeof t === 'function' ? t(params ?? {}) : t;
}

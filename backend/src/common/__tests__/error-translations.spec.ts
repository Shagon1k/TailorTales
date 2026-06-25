import { resolveLocale, translate } from '../error-translations.js';

describe('resolveLocale', () => {
    it('should return en when header is absent', () => {
        expect(resolveLocale(undefined)).toBe('en');
    });

    it('should return en for an empty string', () => {
        expect(resolveLocale('')).toBe('en');
    });

    it('should resolve a single matching locale', () => {
        expect(resolveLocale('de')).toBe('de');
        expect(resolveLocale('ru')).toBe('ru');
        expect(resolveLocale('en')).toBe('en');
    });

    it('should pick the first supported locale from a q-weighted list', () => {
        expect(resolveLocale('de,en-US;q=0.9,en;q=0.8')).toBe('de');
    });

    it('should fall through to a later supported locale when the first is unknown', () => {
        expect(resolveLocale('fr,de;q=0.9')).toBe('de');
    });

    it('should ignore the region subtag and match on the two-letter language code', () => {
        expect(resolveLocale('en-US')).toBe('en');
        expect(resolveLocale('de-AT')).toBe('de');
    });

    it('should default to en when no supported locale is found', () => {
        expect(resolveLocale('fr,es,pt')).toBe('en');
    });

    it('should be case-insensitive', () => {
        expect(resolveLocale('DE')).toBe('de');
        expect(resolveLocale('RU,EN;q=0.8')).toBe('ru');
    });
});

describe('translate', () => {
    describe('simple (string) entries', () => {
        it('should return the English translation', () => {
            expect(translate('errors.ratings.storyNotCompleted', 'en')).toBe(
                'Only completed stories can be rated.',
            );
        });

        it('should return the German translation', () => {
            expect(translate('errors.ratings.storyNotCompleted', 'de')).toBe(
                'Nur abgeschlossene Geschichten können bewertet werden.',
            );
        });

        it('should return the Russian translation', () => {
            expect(translate('errors.ratings.storyNotCompleted', 'ru')).toBe(
                'Оценивать можно только завершённые истории.',
            );
        });
    });

    describe('parameterized (function) entries', () => {
        it('should interpolate page-credit error params in English', () => {
            const msg = translate('errors.quota.pageCreditsExceeded', 'en', {
                cost: 5,
                remaining: 4,
                limit: 12,
            });
            expect(msg).toContain('5');
            expect(msg).toContain('4');
            expect(msg).toContain('12');
        });

        it('should interpolate page-credit error params in German', () => {
            const msg = translate('errors.quota.pageCreditsExceeded', 'de', {
                cost: 5,
                remaining: 4,
                limit: 12,
            });
            expect(msg).toContain('5');
            expect(msg).toContain('4');
            expect(msg).toContain('12');
        });

        it('should interpolate regeneration limit in Russian', () => {
            const msg = translate('errors.quota.regenerationsExceeded', 'ru', { limit: 10 });
            expect(msg).toContain('10');
        });

        it('should interpolate character-generation limit in English', () => {
            const msg = translate('errors.quota.characterGenerationsExceeded', 'en', {
                limit: 3,
            });
            expect(msg).toContain('3');
        });
    });

    it('should return undefined for an unknown code', () => {
        expect(translate('errors.does.not.exist', 'en')).toBeUndefined();
    });
});

import { mergePreferences } from '../notification-preferences.js';

describe('mergePreferences', () => {
    it('should default every toggle to on for a null stored value', () => {
        expect(mergePreferences(null)).toEqual({
            storyCompleted: { email: true, inApp: true },
            storyFailed: { email: true, inApp: true },
            paymentFailed: { inApp: true },
            subscriptionCanceled: { email: true, inApp: true },
            subscriptionRenewed: { email: true },
        });
    });

    it('should apply stored partial overrides and default the rest', () => {
        const prefs = mergePreferences({
            storyCompleted: { email: false },
            subscriptionRenewed: { email: false },
        });

        expect(prefs.storyCompleted).toEqual({ email: false, inApp: true });
        expect(prefs.subscriptionRenewed).toEqual({ email: false });
        expect(prefs.storyFailed).toEqual({ email: true, inApp: true });
    });

    it('should fall back to defaults for malformed stored values', () => {
        const prefs = mergePreferences({
            storyCompleted: 'broken',
            storyFailed: { email: 'nope' },
        });

        expect(prefs.storyCompleted).toEqual({ email: true, inApp: true });
        expect(prefs.storyFailed).toEqual({ email: true, inApp: true });
    });
});

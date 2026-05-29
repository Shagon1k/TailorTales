/**
 * Human-readable relative time for a past ISO date.
 * Uses Intl.RelativeTimeFormat — "yesterday", "3 days ago", "last week", etc.
 * Add a case here when a new language is supported.
 *
 * @example getRelativeTime('2026-05-21T10:00:00Z') // "7 days ago"
 */
export function getRelativeTime(isoDate: string): string {
    const locale = 'en-US';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    const diffMs = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(diffMs / 86_400_000);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (minutes < 1) return rtf.format(0, 'second'); // "now"
    if (hours < 1) return rtf.format(-minutes, 'minute'); // "5 minutes ago"
    if (days < 1) return rtf.format(-hours, 'hour'); // "3 hours ago"
    if (weeks < 1) return rtf.format(-days, 'day'); // "yesterday" / "2 days ago"
    if (months < 1) return rtf.format(-weeks, 'week'); // "last week" / "3 weeks ago"
    return rtf.format(-months, 'month'); // "last month" / "3 months ago"
}

/** Compute integer age from an ISO birthdate string. */
export function getAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
}

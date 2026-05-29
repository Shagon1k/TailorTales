export type TPeriod = 'morning' | 'afternoon' | 'evening';

export function getPeriod(hour: number): TPeriod {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
}

export function getPeriodLabel(period: TPeriod): string {
    return period;
}

/** @example formatDateLine(new Date(), 'evening') → "· Thursday evening · May 21 ·" */
export function formatDateLine(date: Date, period: TPeriod, locale = 'en-US'): string {
    const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
    const monthName = date.toLocaleDateString(locale, { month: 'short' });
    const day = date.getDate();
    const periodLabel = getPeriodLabel(period);
    return `· ${dayName} ${periodLabel} · ${monthName} ${day} ·`;
}

/**
 * Formats an amount in the smallest currency unit (cents) for display.
 * Whole amounts drop the decimals: 500 → "€5", 1050 → "€10.50".
 */
export function formatMoney(amountCents: number, currency = 'EUR'): string {
    const symbol = currency === 'EUR' ? '€' : `${currency} `;
    const units = amountCents / 100;
    return Number.isInteger(units) ? `${symbol}${units}` : `${symbol}${units.toFixed(2)}`;
}

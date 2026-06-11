// TODO(Phase 9): remove both constants — replace with PricingTier.regenerationsPerMonth
//   read from the user's active Subscription. The rolling-window logic in RegenerationService
//   also disappears; Paddle webhook owns the billing cycle reset.

/** Free-tier cap on page regenerations per 30-day window. */
export const FREE_TIER_REGENERATION_LIMIT = 10;

/** Length of the regeneration quota window in days. */
export const REGEN_WINDOW_DAYS = 30;

-- Phase 9: regeneration quota moved from User to Subscription/PricingTier.
-- Carry Phase 8 usage into Subscription rows before dropping the columns
-- (no-op on fresh databases — both tables are empty at this point).
UPDATE "Subscription" s
SET "regenerationsUsed" = GREATEST(s."regenerationsUsed", u."regenerationsInWindow")
FROM "User" u
WHERE u.id = s."userId";

ALTER TABLE "User" DROP COLUMN "regenerationsInWindow";
ALTER TABLE "User" DROP COLUMN "regenerationWindowStartedAt";

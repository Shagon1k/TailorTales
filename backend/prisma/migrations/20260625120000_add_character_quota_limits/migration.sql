ALTER TABLE "PricingTier"
ADD COLUMN "characterGenerationsPerMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "charactersLimit" INTEGER;

ALTER TABLE "Subscription"
ADD COLUMN "characterGenerationsUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: add 30-day regeneration quota tracking to User
ALTER TABLE "User" ADD COLUMN "regenerationsInWindow"       INTEGER   NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "regenerationWindowStartedAt" TIMESTAMP(3);

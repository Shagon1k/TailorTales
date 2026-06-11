-- Make thumbnailUrl nullable on ArtStyle.
-- Clears placeholder frontend paths seeded before Phase 12 generates real S3 thumbnails.
ALTER TABLE "ArtStyle" ALTER COLUMN "thumbnailUrl" DROP NOT NULL;
UPDATE "ArtStyle" SET "thumbnailUrl" = NULL WHERE "thumbnailUrl" LIKE '/images/art-styles/%';

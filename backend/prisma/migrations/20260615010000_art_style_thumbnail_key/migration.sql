-- Rename ArtStyle.thumbnailUrl to thumbnailKey.
-- Phase 12 generates thumbnails as private S3 objects and signs them at serve time,
-- so the column now holds an S3 key, not a URL. Existing values are all NULL.
ALTER TABLE "ArtStyle" RENAME COLUMN "thumbnailUrl" TO "thumbnailKey";

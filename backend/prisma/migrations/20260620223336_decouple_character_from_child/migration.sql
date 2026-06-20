-- CreateEnum
CREATE TYPE "CharacterSource" AS ENUM ('FROM_CHILD', 'IMAGINED', 'PROMPT', 'PHOTO');

-- DropIndex
DROP INDEX "Character_childId_key";

-- AlterTable
ALTER TABLE "Character" ADD COLUMN     "source" "CharacterSource" NOT NULL DEFAULT 'IMAGINED';

-- Backfill: characters already linked to a child were created to mirror that child.
UPDATE "Character" SET "source" = 'FROM_CHILD' WHERE "childId" IS NOT NULL;

/*
  Warnings:

  - Made the column `childId` on table `Character` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Character" DROP CONSTRAINT "Character_childId_fkey";

-- Characters now belong to a child. Remove any orphan standalone characters
-- (childId IS NULL) — the "user-level character" concept no longer exists.
DELETE FROM "Character" WHERE "childId" IS NULL;

-- AlterTable
ALTER TABLE "Character" ALTER COLUMN "childId" SET NOT NULL,
ALTER COLUMN "source" SET DEFAULT 'FROM_CHILD';

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE CASCADE ON UPDATE CASCADE;

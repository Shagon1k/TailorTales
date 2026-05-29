/*
  Warnings:

  - You are about to drop the column `templateId` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the `Template` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Story" DROP CONSTRAINT "Story_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Template" DROP CONSTRAINT "Template_createdById_fkey";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "templateId",
ADD COLUMN     "blueprintId" TEXT;

-- DropTable
DROP TABLE "Template";

-- CreateTable
CREATE TABLE "StoryBlueprint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "StoryType" NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "coverImageKey" TEXT,
    "previewPageKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryBlueprint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "StoryBlueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryBlueprint" ADD CONSTRAINT "StoryBlueprint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `customization` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `blueprint` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `customizableFields` on the `Template` table. All the data in the column will be lost.
  - Added the required column `pageCount` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `Story` table without a default value. This is not possible if the table is not empty.
  - Added the required column `systemPrompt` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "text" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "customization",
ADD COLUMN     "pageCount" INTEGER NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "blueprint",
DROP COLUMN "customizableFields",
ADD COLUMN     "previewPageUrls" TEXT[],
ADD COLUMN     "systemPrompt" TEXT NOT NULL;

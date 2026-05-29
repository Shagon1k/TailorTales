/*
  Warnings:

  - You are about to drop the column `pdfUrl` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageUrl` on the `Template` table. All the data in the column will be lost.
  - You are about to drop the column `previewPageUrls` on the `Template` table. All the data in the column will be lost.
  - Added the required column `coverImageKey` to the `Template` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "pdfUrl",
ADD COLUMN     "coverImageKey" TEXT,
ADD COLUMN     "pdfKey" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "Template" DROP COLUMN "coverImageUrl",
DROP COLUMN "previewPageUrls",
ADD COLUMN     "coverImageKey" TEXT NOT NULL,
ADD COLUMN     "previewPageKeys" TEXT[];

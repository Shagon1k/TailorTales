/*
  Warnings:

  - Changed the type of `language` on the `Story` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'RU');

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "language",
ADD COLUMN     "language" "Language" NOT NULL;

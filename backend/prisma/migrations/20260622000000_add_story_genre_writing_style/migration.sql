-- CreateEnum
CREATE TYPE "StoryGenre" AS ENUM ('FAIRY_TALE', 'BEDTIME', 'EDUCATIONAL', 'ADVENTURE');

-- CreateEnum
CREATE TYPE "WritingStyle" AS ENUM ('POETIC', 'SIMPLE', 'IMAGINATIVE');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "genre" "StoryGenre",
ADD COLUMN     "writingStyle" "WritingStyle";

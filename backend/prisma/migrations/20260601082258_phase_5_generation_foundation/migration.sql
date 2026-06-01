-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('generation', 'regeneration');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('pending', 'active', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('story_completed', 'story_failed');

-- AlterTable
ALTER TABLE "Page" ADD COLUMN     "illustrationPrompt" TEXT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "styleAnchor" TEXT;

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

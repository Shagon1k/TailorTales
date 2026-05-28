-- AlterTable
ALTER TABLE "Template" ALTER COLUMN "coverImageKey" DROP NOT NULL,
ALTER COLUMN "previewPageKeys" SET DEFAULT ARRAY[]::TEXT[];

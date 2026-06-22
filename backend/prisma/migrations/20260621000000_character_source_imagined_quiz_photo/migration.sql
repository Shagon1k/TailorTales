-- Replace CharacterSource {FROM_CHILD, IMAGINED, PROMPT, PHOTO} with {IMAGINED, QUIZ, PHOTO}.
-- Free-form characters (manual + prompt) collapse to IMAGINED; PHOTO is preserved.
-- Postgres can't drop enum values in place, so recreate the type.

ALTER TABLE "Character" ALTER COLUMN "source" DROP DEFAULT;

CREATE TYPE "CharacterSource_new" AS ENUM ('IMAGINED', 'QUIZ', 'PHOTO');

ALTER TABLE "Character" ALTER COLUMN "source" TYPE "CharacterSource_new"
USING (
  CASE "source"::text
    WHEN 'PHOTO' THEN 'PHOTO'
    WHEN 'QUIZ' THEN 'QUIZ'
    ELSE 'IMAGINED'
  END
)::"CharacterSource_new";

DROP TYPE "CharacterSource";
ALTER TYPE "CharacterSource_new" RENAME TO "CharacterSource";

ALTER TABLE "Character" ALTER COLUMN "source" SET DEFAULT 'IMAGINED';

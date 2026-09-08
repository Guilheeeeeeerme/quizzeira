-- AlterTable
ALTER TABLE `Topic` ADD COLUMN `inferredSyllabus` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `QuizAttempt` ADD COLUMN `durationMinutes` INTEGER NULL;

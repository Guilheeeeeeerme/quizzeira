-- Slim study schema: drop levels, attachments, links, updater proposals
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `question_update_proposals`;
DROP TABLE IF EXISTS `TopicAttachment`;
DROP TABLE IF EXISTS `TopicLink`;

ALTER TABLE `Question` DROP FOREIGN KEY `Question_levelId_fkey`;
ALTER TABLE `QuizAttempt` DROP FOREIGN KEY `QuizAttempt_levelId_fkey`;

ALTER TABLE `Question` DROP COLUMN `levelId`;
ALTER TABLE `QuizAttempt` DROP COLUMN `levelId`;

DROP TABLE IF EXISTS `DifficultyLevel`;

SET FOREIGN_KEY_CHECKS = 1;

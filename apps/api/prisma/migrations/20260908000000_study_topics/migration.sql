-- AlterEnum
ALTER TABLE `QuizAttempt` MODIFY `status` ENUM('GENERATING', 'IN_PROGRESS', 'PENDING', 'IN_CORRECTION', 'CORRECTED') NOT NULL DEFAULT 'IN_PROGRESS';

-- CreateTable
CREATE TABLE `Topic` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `guidelines` TEXT NOT NULL,
    `presetSlug` VARCHAR(191) NULL,
    `preferredLocale` VARCHAR(191) NULL,
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Topic_userId_idx`(`userId`),
    INDEX `Topic_lastUsedAt_idx`(`lastUsedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `kind` ENUM('TEXT', 'PDF', 'IMAGE') NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `extractedText` LONGTEXT NULL,
    `byteSize` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TopicAttachment_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TopicLink` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `label` VARCHAR(191) NULL,
    `fetchedText` LONGTEXT NULL,
    `fetchStatus` ENUM('PENDING', 'OK', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TopicLink_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable Question
ALTER TABLE `Question` MODIFY `levelId` INTEGER NULL;
ALTER TABLE `Question` ADD COLUMN `topicId` VARCHAR(191) NULL;
ALTER TABLE `Question` ADD COLUMN `sourceAttemptId` VARCHAR(191) NULL;
CREATE INDEX `Question_topicId_idx` ON `Question`(`topicId`);
CREATE INDEX `Question_levelId_idx` ON `Question`(`levelId`);

-- AlterTable QuizAttempt
ALTER TABLE `QuizAttempt` MODIFY `levelId` INTEGER NULL;
ALTER TABLE `QuizAttempt` ADD COLUMN `topicId` VARCHAR(191) NULL;
ALTER TABLE `QuizAttempt` ADD COLUMN `locale` VARCHAR(191) NOT NULL DEFAULT 'en';
ALTER TABLE `QuizAttempt` ADD COLUMN `focusText` TEXT NULL;
ALTER TABLE `QuizAttempt` ADD COLUMN `generationStartedAt` DATETIME(3) NULL;
CREATE INDEX `QuizAttempt_topicId_idx` ON `QuizAttempt`(`topicId`);
CREATE INDEX `QuizAttempt_status_idx` ON `QuizAttempt`(`status`);

-- AlterTable QuizAnswer
ALTER TABLE `QuizAnswer` ADD COLUMN `explanation` TEXT NULL;
ALTER TABLE `QuizAnswer` ADD COLUMN `correctAnswerSummary` TEXT NULL;

-- AddForeignKey
ALTER TABLE `Topic` ADD CONSTRAINT `Topic_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TopicAttachment` ADD CONSTRAINT `TopicAttachment_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TopicLink` ADD CONSTRAINT `TopicLink_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Question` ADD CONSTRAINT `Question_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `QuizAttempt` ADD CONSTRAINT `QuizAttempt_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

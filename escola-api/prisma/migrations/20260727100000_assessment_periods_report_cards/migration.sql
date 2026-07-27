-- CreateEnum
-- ReportCardStatus

-- AlterTable
ALTER TABLE `Assessment` ADD COLUMN `periodId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AssessmentPeriod` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AssessmentPeriod_academicYearId_sortOrder_idx`(`academicYearId`, `sortOrder`),
    INDEX `AssessmentPeriod_unitId_idx`(`unitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportCard` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `periodId` VARCHAR(191) NOT NULL,
    `classGroupId` VARCHAR(191) NOT NULL,
    `status` ENUM('RASCUNHO', 'PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
    `overallComment` TEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReportCard_periodId_status_idx`(`periodId`, `status`),
    INDEX `ReportCard_classGroupId_status_idx`(`classGroupId`, `status`),
    INDEX `ReportCard_status_publishedAt_idx`(`status`, `publishedAt`),
    UNIQUE INDEX `ReportCard_studentId_periodId_classGroupId_key`(`studentId`, `periodId`, `classGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportCardLine` (
    `id` VARCHAR(191) NOT NULL,
    `reportCardId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `gradeType` ENUM('NUMERICA', 'QUALITATIVA') NULL,
    `gradeValue` DOUBLE NULL,
    `gradeLabel` VARCHAR(191) NULL,
    `comment` TEXT NULL,
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `sourceId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReportCardLine_reportCardId_sortOrder_idx`(`reportCardId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Assessment_periodId_idx` ON `Assessment`(`periodId`);

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `AssessmentPeriod`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentPeriod` ADD CONSTRAINT `AssessmentPeriod_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentPeriod` ADD CONSTRAINT `AssessmentPeriod_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportCard` ADD CONSTRAINT `ReportCard_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportCard` ADD CONSTRAINT `ReportCard_periodId_fkey` FOREIGN KEY (`periodId`) REFERENCES `AssessmentPeriod`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportCard` ADD CONSTRAINT `ReportCard_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportCard` ADD CONSTRAINT `ReportCard_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportCardLine` ADD CONSTRAINT `ReportCardLine_reportCardId_fkey` FOREIGN KEY (`reportCardId`) REFERENCES `ReportCard`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

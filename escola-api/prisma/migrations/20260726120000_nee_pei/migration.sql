-- CreateTable
CREATE TABLE `NeeProfile` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `diagnosisSummary` TEXT NULL,
    `notes` TEXT NULL,
    `identifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NeeProfile_studentId_key`(`studentId`),
    INDEX `NeeProfile_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeiPlan` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `neeProfileId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NULL,
    `status` ENUM('RASCUNHO', 'ACTIVO', 'EM_REVISAO', 'CONCLUIDO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO',
    `title` VARCHAR(191) NULL,
    `objectives` TEXT NOT NULL,
    `strategies` TEXT NULL,
    `supports` TEXT NULL,
    `guardianSummary` TEXT NULL,
    `responsibleTeacher` VARCHAR(191) NULL,
    `coordinatorNotes` TEXT NULL,
    `reviewDate` DATE NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PeiPlan_studentId_status_idx`(`studentId`, `status`),
    INDEX `PeiPlan_academicYearId_idx`(`academicYearId`),
    INDEX `PeiPlan_status_reviewDate_idx`(`status`, `reviewDate`),
    INDEX `PeiPlan_neeProfileId_idx`(`neeProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PeiReview` (
    `id` VARCHAR(191) NOT NULL,
    `peiPlanId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `notes` TEXT NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PeiReview_peiPlanId_date_idx`(`peiPlanId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NeeProfile` ADD CONSTRAINT `NeeProfile_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeiPlan` ADD CONSTRAINT `PeiPlan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeiPlan` ADD CONSTRAINT `PeiPlan_neeProfileId_fkey` FOREIGN KEY (`neeProfileId`) REFERENCES `NeeProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeiPlan` ADD CONSTRAINT `PeiPlan_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeiPlan` ADD CONSTRAINT `PeiPlan_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeiReview` ADD CONSTRAINT `PeiReview_peiPlanId_fkey` FOREIGN KEY (`peiPlanId`) REFERENCES `PeiPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeiReview` ADD CONSTRAINT `PeiReview_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

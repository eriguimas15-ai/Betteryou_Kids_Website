-- CreateEnum
CREATE TABLE `CurriculumPlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `levelLabel` VARCHAR(191) NULL,
    `classGroupId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CurriculumPlan_serviceId_active_idx`(`serviceId`, `active`),
    INDEX `CurriculumPlan_academicYearId_idx`(`academicYearId`),
    INDEX `CurriculumPlan_unitId_idx`(`unitId`),
    INDEX `CurriculumPlan_classGroupId_idx`(`classGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CurriculumArea` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CurriculumArea_planId_sortOrder_idx`(`planId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CurriculumObjective` (
    `id` VARCHAR(191) NOT NULL,
    `areaId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CurriculumObjective_areaId_sortOrder_idx`(`areaId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DescriptiveReport` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NULL,
    `periodLabel` VARCHAR(191) NOT NULL,
    `areaFocus` VARCHAR(191) NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('RASCUNHO', 'PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
    `authorId` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DescriptiveReport_studentId_status_idx`(`studentId`, `status`),
    INDEX `DescriptiveReport_academicYearId_idx`(`academicYearId`),
    INDEX `DescriptiveReport_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Substitution` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `classGroupId` VARCHAR(191) NOT NULL,
    `absentTeacher` VARCHAR(191) NOT NULL,
    `substituteTeacher` VARCHAR(191) NOT NULL,
    `substituteUserId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` ENUM('PLANEADA', 'CONFIRMADA', 'CANCELADA', 'CONCLUIDA') NOT NULL DEFAULT 'PLANEADA',
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Substitution_date_classGroupId_idx`(`date`, `classGroupId`),
    INDEX `Substitution_classGroupId_status_idx`(`classGroupId`, `status`),
    INDEX `Substitution_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmsLog` (
    `id` VARCHAR(191) NOT NULL,
    `to` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `status` ENUM('SIMULADO', 'ENVIADO', 'FALHA') NOT NULL DEFAULT 'SIMULADO',
    `provider` VARCHAR(191) NOT NULL,
    `providerResponse` TEXT NULL,
    `communicationId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `classGroupId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SmsLog_createdAt_idx`(`createdAt`),
    INDEX `SmsLog_status_idx`(`status`),
    INDEX `SmsLog_communicationId_idx`(`communicationId`),
    INDEX `SmsLog_unitId_idx`(`unitId`),
    INDEX `SmsLog_classGroupId_idx`(`classGroupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CurriculumPlan` ADD CONSTRAINT `CurriculumPlan_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CurriculumPlan` ADD CONSTRAINT `CurriculumPlan_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CurriculumPlan` ADD CONSTRAINT `CurriculumPlan_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CurriculumPlan` ADD CONSTRAINT `CurriculumPlan_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CurriculumArea` ADD CONSTRAINT `CurriculumArea_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `CurriculumPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CurriculumObjective` ADD CONSTRAINT `CurriculumObjective_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `CurriculumArea`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DescriptiveReport` ADD CONSTRAINT `DescriptiveReport_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DescriptiveReport` ADD CONSTRAINT `DescriptiveReport_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DescriptiveReport` ADD CONSTRAINT `DescriptiveReport_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Substitution` ADD CONSTRAINT `Substitution_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Substitution` ADD CONSTRAINT `Substitution_substituteUserId_fkey` FOREIGN KEY (`substituteUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Substitution` ADD CONSTRAINT `Substitution_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmsLog` ADD CONSTRAINT `SmsLog_communicationId_fkey` FOREIGN KEY (`communicationId`) REFERENCES `Communication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmsLog` ADD CONSTRAINT `SmsLog_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmsLog` ADD CONSTRAINT `SmsLog_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmsLog` ADD CONSTRAINT `SmsLog_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

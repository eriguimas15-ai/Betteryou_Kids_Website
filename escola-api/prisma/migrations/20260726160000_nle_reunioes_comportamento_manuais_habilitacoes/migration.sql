-- CreateEnum
CREATE TABLE `NonTeachingActivity` (
    `id` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `teacherName` VARCHAR(191) NOT NULL,
    `teacherUserId` VARCHAR(191) NULL,
    `classGroupId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `durationMinutes` INTEGER NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NonTeachingActivity_date_idx`(`date`),
    INDEX `NonTeachingActivity_classGroupId_date_idx`(`classGroupId`, `date`),
    INDEX `NonTeachingActivity_teacherUserId_date_idx`(`teacherUserId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meeting` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `dateTime` DATETIME(3) NOT NULL,
    `type` ENUM('PEDAGOGICA', 'COORDENACAO', 'ENCARREGADOS', 'OUTRA') NOT NULL DEFAULT 'PEDAGOGICA',
    `participantsNotes` TEXT NULL,
    `unitId` VARCHAR(191) NULL,
    `classGroupId` VARCHAR(191) NULL,
    `status` ENUM('AGENDADA', 'REALIZADA', 'CANCELADA') NOT NULL DEFAULT 'AGENDADA',
    `visibleToGuardians` BOOLEAN NOT NULL DEFAULT false,
    `location` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Meeting_dateTime_status_idx`(`dateTime`, `status`),
    INDEX `Meeting_type_idx`(`type`),
    INDEX `Meeting_unitId_idx`(`unitId`),
    INDEX `Meeting_classGroupId_idx`(`classGroupId`),
    INDEX `Meeting_visibleToGuardians_dateTime_idx`(`visibleToGuardians`, `dateTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingMinutes` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `status` ENUM('RASCUNHO', 'PUBLICADA') NOT NULL DEFAULT 'RASCUNHO',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MeetingMinutes_meetingId_key`(`meetingId`),
    INDEX `MeetingMinutes_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BehaviorRecord` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `type` ENUM('POSITIVO', 'A_MELHORAR', 'INCIDENTE') NOT NULL DEFAULT 'POSITIVO',
    `description` TEXT NOT NULL,
    `authorId` VARCHAR(191) NULL,
    `visibleToGuardian` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BehaviorRecord_studentId_date_idx`(`studentId`, `date`),
    INDEX `BehaviorRecord_type_idx`(`type`),
    INDEX `BehaviorRecord_visibleToGuardian_idx`(`visibleToGuardian`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SchoolManual` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subjectArea` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NULL,
    `publisher` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `mediaUrl` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SchoolManual_serviceId_active_idx`(`serviceId`, `active`),
    INDEX `SchoolManual_academicYearId_idx`(`academicYearId`),
    INDEX `SchoolManual_unitId_idx`(`unitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentQualification` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `issuedAt` DATE NOT NULL,
    `issuer` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `documentUrl` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentQualification_studentId_issuedAt_idx`(`studentId`, `issuedAt`),
    INDEX `StudentQualification_academicYearId_idx`(`academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NonTeachingActivity` ADD CONSTRAINT `NonTeachingActivity_teacherUserId_fkey` FOREIGN KEY (`teacherUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NonTeachingActivity` ADD CONSTRAINT `NonTeachingActivity_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NonTeachingActivity` ADD CONSTRAINT `NonTeachingActivity_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingMinutes` ADD CONSTRAINT `MeetingMinutes_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `Meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MeetingMinutes` ADD CONSTRAINT `MeetingMinutes_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BehaviorRecord` ADD CONSTRAINT `BehaviorRecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BehaviorRecord` ADD CONSTRAINT `BehaviorRecord_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolManual` ADD CONSTRAINT `SchoolManual_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolManual` ADD CONSTRAINT `SchoolManual_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolManual` ADD CONSTRAINT `SchoolManual_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SchoolManual` ADD CONSTRAINT `SchoolManual_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentQualification` ADD CONSTRAINT `StudentQualification_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentQualification` ADD CONSTRAINT `StudentQualification_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentQualification` ADD CONSTRAINT `StudentQualification_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

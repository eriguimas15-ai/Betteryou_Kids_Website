-- CreateTable
CREATE TABLE `Student` (
    `id` VARCHAR(191) NOT NULL,
    `guardianUserId` VARCHAR(191) NULL,
    `enrollmentId` VARCHAR(191) NULL,
    `renewalId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NULL,
    `childFullName` VARCHAR(191) NOT NULL,
    `childBirthDate` DATETIME(3) NULL,
    `childSex` VARCHAR(191) NULL,
    `childBirthPlace` VARCHAR(191) NULL,
    `childNationality` VARCHAR(191) NULL,
    `childAddress` VARCHAR(191) NULL,
    `guardianFullName` VARCHAR(191) NOT NULL,
    `guardianIdNumber` VARCHAR(191) NULL,
    `guardianPhone` VARCHAR(191) NOT NULL,
    `guardianAltPhone` VARCHAR(191) NULL,
    `guardianEmail` VARCHAR(191) NOT NULL,
    `guardianProfession` VARCHAR(191) NULL,
    `guardianRelationship` VARCHAR(191) NULL,
    `guardianAddress` VARCHAR(191) NULL,
    `emergencyName` VARCHAR(191) NULL,
    `emergencyPhone` VARCHAR(191) NULL,
    `emergencyRelation` VARCHAR(191) NULL,
    `allergies` TEXT NULL,
    `medication` TEXT NULL,
    `foodRestrictions` TEXT NULL,
    `medicalNotes` TEXT NULL,
    `profileStatus` ENUM('PENDENTE_FICHA', 'COMPLETA') NOT NULL DEFAULT 'PENDENTE_FICHA',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Student_enrollmentId_key`(`enrollmentId`),
    UNIQUE INDEX `Student_renewalId_key`(`renewalId`),
    INDEX `Student_guardianEmail_idx`(`guardianEmail`),
    INDEX `Student_profileStatus_idx`(`profileStatus`),
    INDEX `Student_guardianUserId_idx`(`guardianUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_guardianUserId_fkey` FOREIGN KEY (`guardianUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_renewalId_fkey` FOREIGN KEY (`renewalId`) REFERENCES `Renewal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

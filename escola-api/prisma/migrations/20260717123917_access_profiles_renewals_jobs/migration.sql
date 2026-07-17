-- AlterTable
ALTER TABLE `user` ADD COLUMN `accessProfileId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `AccessProfile` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `systemKey` VARCHAR(191) NULL,
    `modules` JSON NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AccessProfile_name_key`(`name`),
    UNIQUE INDEX `AccessProfile_systemKey_key`(`systemKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Renewal` (
    `id` VARCHAR(191) NOT NULL,
    `academicYearId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NULL,
    `childFullName` VARCHAR(191) NOT NULL,
    `guardianFullName` VARCHAR(191) NOT NULL,
    `guardianEmail` VARCHAR(191) NOT NULL,
    `guardianPhone` VARCHAR(191) NOT NULL,
    `previousYearLabel` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `status` ENUM('PENDENTE', 'CONFIRMADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Renewal_status_idx`(`status`),
    INDEX `Renewal_guardianEmail_idx`(`guardianEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobOpening` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `description` TEXT NOT NULL,
    `requirements` TEXT NULL,
    `status` ENUM('RASCUNHO', 'PUBLICADA', 'ENCERRADA') NOT NULL DEFAULT 'RASCUNHO',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `JobOpening_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_accessProfileId_fkey` FOREIGN KEY (`accessProfileId`) REFERENCES `AccessProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Renewal` ADD CONSTRAINT `Renewal_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Renewal` ADD CONSTRAINT `Renewal_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Renewal` ADD CONSTRAINT `Renewal_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Renewal` ADD CONSTRAINT `Renewal_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

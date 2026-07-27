-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('FESTA', 'EVENTO', 'PASSEIO', 'WORKSHOP') NOT NULL DEFAULT 'EVENTO',
    `status` ENUM('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO',
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `priceAkz` INTEGER NULL,
    `imageUrl` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `publishAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_status_startAt_idx`(`status`, `startAt`),
    INDEX `Event_type_idx`(`type`),
    INDEX `Event_unitId_idx`(`unitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `guardianUserId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `childName` VARCHAR(191) NOT NULL,
    `guardianName` VARCHAR(191) NOT NULL,
    `guardianEmail` VARCHAR(191) NOT NULL,
    `guardianPhone` VARCHAR(191) NULL,
    `attendees` INTEGER NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `status` ENUM('INSCRITO', 'LISTA_ESPERA', 'CANCELADO') NOT NULL DEFAULT 'INSCRITO',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EventRegistration_eventId_status_idx`(`eventId`, `status`),
    INDEX `EventRegistration_guardianUserId_idx`(`guardianUserId`),
    INDEX `EventRegistration_guardianEmail_idx`(`guardianEmail`),
    UNIQUE INDEX `EventRegistration_eventId_guardianEmail_key`(`eventId`, `guardianEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration` ADD CONSTRAINT `EventRegistration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration` ADD CONSTRAINT `EventRegistration_guardianUserId_fkey` FOREIGN KEY (`guardianUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration` ADD CONSTRAINT `EventRegistration_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

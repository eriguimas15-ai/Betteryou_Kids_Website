-- CreateTable
CREATE TABLE `Communication` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `audience` ENUM('ESCOLA', 'UNIDADE', 'SERVICO', 'TURMA', 'ENCARREGADO') NOT NULL DEFAULT 'ESCOLA',
    `status` ENUM('RASCUNHO', 'PUBLICADO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO',
    `authorId` VARCHAR(191) NULL,
    `unitId` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NULL,
    `classGroupId` VARCHAR(191) NULL,
    `targetUserId` VARCHAR(191) NULL,
    `targetGuardianEmail` VARCHAR(191) NULL,
    `attachmentUrl` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Communication_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `Communication_audience_idx`(`audience`),
    INDEX `Communication_unitId_idx`(`unitId`),
    INDEX `Communication_serviceId_idx`(`serviceId`),
    INDEX `Communication_classGroupId_idx`(`classGroupId`),
    INDEX `Communication_targetGuardianEmail_idx`(`targetGuardianEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationRead` (
    `id` VARCHAR(191) NOT NULL,
    `communicationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationRead_userId_idx`(`userId`),
    UNIQUE INDEX `CommunicationRead_communicationId_userId_key`(`communicationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_classGroupId_fkey` FOREIGN KEY (`classGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Communication` ADD CONSTRAINT `Communication_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunicationRead` ADD CONSTRAINT `CommunicationRead_communicationId_fkey` FOREIGN KEY (`communicationId`) REFERENCES `Communication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunicationRead` ADD CONSTRAINT `CommunicationRead_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

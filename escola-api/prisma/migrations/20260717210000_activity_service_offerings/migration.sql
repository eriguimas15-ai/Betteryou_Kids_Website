-- CreateTable
CREATE TABLE `ActivityServiceOffering` (
    `id` VARCHAR(191) NOT NULL,
    `activityId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `pricing` ENUM('INCLUDED', 'PAID') NOT NULL,
    `priceAkz` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ActivityServiceOffering_activityId_serviceId_key`(`activityId`, `serviceId`),
    INDEX `ActivityServiceOffering_serviceId_active_idx`(`serviceId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActivityServiceOffering` ADD CONSTRAINT `ActivityServiceOffering_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `ActivityOffering`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActivityServiceOffering` ADD CONSTRAINT `ActivityServiceOffering_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'default',
    `waitlistResponseHours` INTEGER NOT NULL DEFAULT 48,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed singleton row
INSERT INTO `PlatformSettings` (`id`, `waitlistResponseHours`, `updatedAt`)
VALUES ('default', 48, CURRENT_TIMESTAMP(3));

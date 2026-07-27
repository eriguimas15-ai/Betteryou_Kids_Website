-- CreateTable
CREATE TABLE `FeePlan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `amountAkz` INTEGER NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `academicYearId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FeePlan_active_idx`(`active`),
    INDEX `FeePlan_serviceId_idx`(`serviceId`),
    INDEX `FeePlan_academicYearId_idx`(`academicYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `feePlanId` VARCHAR(191) NULL,
    `referenceMonth` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `amountAkz` INTEGER NOT NULL,
    `dueDate` DATE NOT NULL,
    `status` ENUM('PENDENTE', 'PAGO', 'VENCIDO', 'ANULADO') NOT NULL DEFAULT 'PENDENTE',
    `guardianEmail` VARCHAR(191) NOT NULL,
    `notes` TEXT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Invoice_status_dueDate_idx`(`status`, `dueDate`),
    INDEX `Invoice_studentId_idx`(`studentId`),
    INDEX `Invoice_guardianEmail_idx`(`guardianEmail`),
    UNIQUE INDEX `Invoice_studentId_referenceMonth_key`(`studentId`, `referenceMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `amountAkz` INTEGER NOT NULL,
    `paidAt` DATE NOT NULL,
    `method` ENUM('NUMERARIO', 'TRANSFERENCIA', 'MULTICAIXA', 'TPA', 'OUTRO') NOT NULL DEFAULT 'NUMERARIO',
    `reference` VARCHAR(191) NULL,
    `receiptRef` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `recordedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_invoiceId_idx`(`invoiceId`),
    INDEX `Payment_paidAt_idx`(`paidAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeePlan` ADD CONSTRAINT `FeePlan_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `ServiceOffering`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeePlan` ADD CONSTRAINT `FeePlan_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_feePlanId_fkey` FOREIGN KEY (`feePlanId`) REFERENCES `FeePlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

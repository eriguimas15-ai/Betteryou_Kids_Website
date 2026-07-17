-- AlterTable
ALTER TABLE `room` ADD COLUMN `ageLabel` VARCHAR(191) NULL,
    ADD COLUMN `levelLabel` VARCHAR(191) NULL,
    ADD COLUMN `maxAgeYears` DOUBLE NULL,
    ADD COLUMN `minAgeYears` DOUBLE NULL;

-- CreateIndex
CREATE INDEX `Room_unitId_serviceId_academicYearId_active_idx` ON `Room`(`unitId`, `serviceId`, `academicYearId`, `active`);

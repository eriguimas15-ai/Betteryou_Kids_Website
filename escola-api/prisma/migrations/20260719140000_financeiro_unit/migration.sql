-- AlterTable
ALTER TABLE `FeePlan` ADD COLUMN `unitId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `FeePlan_unitId_serviceId_program_kind_name_key` ON `FeePlan`(`unitId`, `serviceId`, `program`, `kind`, `name`);

-- CreateIndex
CREATE INDEX `FeePlan_unitId_serviceId_program_idx` ON `FeePlan`(`unitId`, `serviceId`, `program`);

-- AddForeignKey
ALTER TABLE `FeePlan` ADD CONSTRAINT `FeePlan_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

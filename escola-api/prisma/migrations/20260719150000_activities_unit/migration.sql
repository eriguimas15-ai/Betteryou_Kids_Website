-- AlterTable
ALTER TABLE `ActivityServiceOffering` ADD COLUMN `unitId` VARCHAR(191) NULL;

-- CreateIndex (backs the activityId foreign key before dropping the composite unique)
CREATE INDEX `ActivityServiceOffering_activityId_idx` ON `ActivityServiceOffering`(`activityId`);

-- DropIndex
DROP INDEX `ActivityServiceOffering_activityId_serviceId_key` ON `ActivityServiceOffering`;

-- CreateIndex
CREATE UNIQUE INDEX `ActivityServiceOffering_unitId_activityId_serviceId_key` ON `ActivityServiceOffering`(`unitId`, `activityId`, `serviceId`);

-- CreateIndex
CREATE INDEX `ActivityServiceOffering_unitId_serviceId_active_idx` ON `ActivityServiceOffering`(`unitId`, `serviceId`, `active`);

-- AddForeignKey
ALTER TABLE `ActivityServiceOffering` ADD CONSTRAINT `ActivityServiceOffering_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

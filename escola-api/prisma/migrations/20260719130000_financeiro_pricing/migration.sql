-- AlterTable
ALTER TABLE `FeePlan`
    ADD COLUMN `kind` ENUM('PROPINA', 'TAXA', 'PRODUTO') NOT NULL DEFAULT 'PROPINA',
    ADD COLUMN `program` ENUM('MEIO_TEMPO', 'MEIO_TEMPO_ALIMENTACAO', 'TEMPO_INTEIRO', 'REGULAR', 'INTEGRAL') NULL;

-- AlterTable
ALTER TABLE `Student`
    ADD COLUMN `program` ENUM('MEIO_TEMPO', 'MEIO_TEMPO_ALIMENTACAO', 'TEMPO_INTEIRO', 'REGULAR', 'INTEGRAL') NULL;

-- CreateIndex
CREATE INDEX `FeePlan_kind_idx` ON `FeePlan`(`kind`);

-- CreateIndex
CREATE INDEX `FeePlan_serviceId_program_idx` ON `FeePlan`(`serviceId`, `program`);

-- DropIndex (the composite index above already covers the FK on serviceId)
DROP INDEX `FeePlan_serviceId_idx` ON `FeePlan`;

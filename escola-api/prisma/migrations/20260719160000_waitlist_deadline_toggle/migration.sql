-- AlterTable
ALTER TABLE `PlatformSettings`
    ADD COLUMN `waitlistDeadlineEnabled` BOOLEAN NOT NULL DEFAULT true;

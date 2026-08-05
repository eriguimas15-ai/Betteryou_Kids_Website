-- Campos adicionais dos formulários de inscrição/renovação (alinhados aos Google Forms)
ALTER TABLE `Enrollment` ADD COLUMN `formExtras` JSON NULL;
ALTER TABLE `Renewal` ADD COLUMN `formExtras` JSON NULL;

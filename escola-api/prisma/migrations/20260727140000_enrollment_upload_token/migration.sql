-- SEC-01: token de upload de documentos de candidatura (hash + expiração)

ALTER TABLE `Enrollment`
  ADD COLUMN `uploadTokenHash` VARCHAR(64) NULL,
  ADD COLUMN `uploadTokenExpiresAt` DATETIME(3) NULL;

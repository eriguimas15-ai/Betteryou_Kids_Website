-- Configuração SMS de plataforma (sem segredo em BD).
ALTER TABLE `PlatformSettings`
  ADD COLUMN `smsEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `smsProvider` VARCHAR(191) NOT NULL DEFAULT 'console',
  ADD COLUMN `smsApiUrl` VARCHAR(191) NULL,
  ADD COLUMN `smsFrom` VARCHAR(191) NULL;

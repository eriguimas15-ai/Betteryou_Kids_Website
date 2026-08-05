-- Configuração editável das perguntas de inscrição/renovação por tipo de ensino
ALTER TABLE `PlatformSettings` ADD COLUMN `admissionFormConfig` JSON NULL;

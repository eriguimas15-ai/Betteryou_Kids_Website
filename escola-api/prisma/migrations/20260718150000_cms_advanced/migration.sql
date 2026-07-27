-- AlterEnum: adiciona EM_REVISAO ao ContentStatus (colunas que usam o enum)
ALTER TABLE `ContentPage` MODIFY `status` ENUM('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE `Testimonial` MODIFY `status` ENUM('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO';
ALTER TABLE `GalleryAlbum` MODIFY `status` ENUM('RASCUNHO', 'EM_REVISAO', 'PUBLICADO', 'ARQUIVADO') NOT NULL DEFAULT 'RASCUNHO';

-- AlterTable: agendamento de publicação
ALTER TABLE `ContentPage` ADD COLUMN `publishAt` DATETIME(3) NULL;
ALTER TABLE `Testimonial` ADD COLUMN `publishAt` DATETIME(3) NULL, ADD COLUMN `publishedAt` DATETIME(3) NULL;
ALTER TABLE `GalleryAlbum` ADD COLUMN `publishAt` DATETIME(3) NULL, ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- AlterTable: biblioteca de media e itens de galeria
ALTER TABLE `MediaAsset` ADD COLUMN `category` VARCHAR(191) NULL;
ALTER TABLE `GalleryItem` ADD COLUMN `title` VARCHAR(191) NULL;

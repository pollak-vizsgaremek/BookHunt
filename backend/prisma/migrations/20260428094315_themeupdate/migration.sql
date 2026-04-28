/*
  Warnings:

  - The primary key for the `gyorsitotarazottar` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `gyorsitotarazottar` DROP PRIMARY KEY,
    MODIFY `isbn` VARCHAR(50) NOT NULL,
    ADD PRIMARY KEY (`isbn`);

-- AlterTable
ALTER TABLE `kivansaglista` MODIFY `isbn` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `termek` MODIFY `isbn_issn` VARCHAR(50) NULL;

-- CreateTable
CREATE TABLE `Konyvjelzo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `konyv_id` VARCHAR(255) NOT NULL,
    `cim` VARCHAR(500) NOT NULL,
    `szerzo` VARCHAR(255) NULL,
    `boritokep_url` VARCHAR(500) NULL,
    `oldalszam` INTEGER NOT NULL DEFAULT 0,
    `max_oldalszam` INTEGER NULL,
    `idezet` VARCHAR(255) NULL,
    `frissitve` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `letrehozva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_konyvjelzo_felhasznalo`(`felhasznalo_id`),
    UNIQUE INDEX `Konyvjelzo_felhasznalo_id_konyv_id_key`(`felhasznalo_id`, `konyv_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GlobalSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'default',

    INDEX `GlobalSettings_theme_idx`(`theme`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Konyvjelzo` ADD CONSTRAINT `Konyvjelzo_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

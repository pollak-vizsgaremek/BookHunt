/*
  Warnings:

  - You are about to drop the column `last_known_price` on the `arak` table. All the data in the column will be lost.
  - You are about to drop the column `szerzo` on the `termek` table. All the data in the column will be lost.
  - You are about to drop the `cachedprice` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wishlist` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `utolso_ismert_ar` to the `Arak` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `wishlist` DROP FOREIGN KEY `Wishlist_felhasznalo_id_fkey`;

-- DropIndex
DROP INDEX `idx_szerzo` ON `termek`;

-- AlterTable
ALTER TABLE `arak` DROP COLUMN `last_known_price`,
    ADD COLUMN `utolso_ismert_ar` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `termek` DROP COLUMN `szerzo`;

-- DropTable
DROP TABLE `cachedprice`;

-- DropTable
DROP TABLE `wishlist`;

-- CreateTable
CREATE TABLE `Szerzo` (
    `szerzo_id` INTEGER NOT NULL AUTO_INCREMENT,
    `nev` VARCHAR(255) NOT NULL,

    INDEX `idx_szerzo_nev`(`nev`),
    PRIMARY KEY (`szerzo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GyorsitotarazottAr` (
    `isbn` VARCHAR(20) NOT NULL,
    `adatok` JSON NOT NULL,
    `frissitve` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`isbn`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kivansaglista` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `konyv_id` VARCHAR(255) NOT NULL,
    `cim` VARCHAR(500) NOT NULL,
    `szerzo` VARCHAR(255) NULL,
    `boritokep_url` VARCHAR(500) NULL,
    `isbn` VARCHAR(20) NULL,
    `utolso_ismert_ar` DECIMAL(10, 2) NULL,
    `letrehozva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_wishlist_felhasznalo`(`felhasznalo_id`),
    UNIQUE INDEX `Kivansaglista_felhasznalo_id_konyv_id_key`(`felhasznalo_id`, `konyv_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ertesites` (
    `ertesites_id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `szoveg` TEXT NOT NULL,
    `olvasott` BOOLEAN NOT NULL DEFAULT false,
    `datum` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_notification_felhasznalo`(`felhasznalo_id`),
    PRIMARY KEY (`ertesites_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_SzerzoToTermek` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_SzerzoToTermek_AB_unique`(`A`, `B`),
    INDEX `_SzerzoToTermek_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Kivansaglista` ADD CONSTRAINT `Kivansaglista_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ertesites` ADD CONSTRAINT `Ertesites_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SzerzoToTermek` ADD CONSTRAINT `_SzerzoToTermek_A_fkey` FOREIGN KEY (`A`) REFERENCES `Szerzo`(`szerzo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_SzerzoToTermek` ADD CONSTRAINT `_SzerzoToTermek_B_fkey` FOREIGN KEY (`B`) REFERENCES `Termek`(`termek_id`) ON DELETE CASCADE ON UPDATE CASCADE;

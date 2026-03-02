/*
  Warnings:

  - You are about to drop the column `profilkep` on the `felhasznalo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `felhasznalo` DROP COLUMN `profilkep`;

-- CreateTable
CREATE TABLE `Velemeny` (
    `velemeny_id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `termek_id` INTEGER NOT NULL,
    `csillag` INTEGER NOT NULL,
    `szoveg` TEXT NULL,
    `datum` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_termek`(`termek_id`),
    INDEX `idx_felhasznalo`(`felhasznalo_id`),
    UNIQUE INDEX `Velemeny_felhasznalo_id_termek_id_key`(`felhasznalo_id`, `termek_id`),
    PRIMARY KEY (`velemeny_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Velemeny` ADD CONSTRAINT `Velemeny_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Velemeny` ADD CONSTRAINT `Velemeny_termek_id_fkey` FOREIGN KEY (`termek_id`) REFERENCES `Termek`(`termek_id`) ON DELETE CASCADE ON UPDATE CASCADE;

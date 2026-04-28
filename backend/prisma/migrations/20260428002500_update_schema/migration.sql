-- AlterTable
ALTER TABLE `Felhasznalo` ADD COLUMN `utolso_pfp_modositas` DATETIME(3) NULL,
    ADD COLUMN `pfp_modositas_szamlalo` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `GlobalSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'default',

    INDEX `GlobalSettings_theme_idx`(`theme`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `felhasznalo` ADD COLUMN `profilkep` VARCHAR(500) NULL,
    ADD COLUMN `tiltas_oka` TEXT NULL,
    ADD COLUMN `tiltva_eddig` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `ForumBejegyzes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `konyv_id` VARCHAR(255) NOT NULL,
    `konyv_cim` VARCHAR(500) NOT NULL,
    `konyv_boritokep` VARCHAR(500) NULL,
    `cim` VARCHAR(255) NOT NULL,
    `tartalom` TEXT NOT NULL,
    `ertekeles` INTEGER NOT NULL,
    `up_szavazatok` INTEGER NOT NULL DEFAULT 0,
    `down_szavazatok` INTEGER NOT NULL DEFAULT 0,
    `letrehozva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_forum_felhasznalo`(`felhasznalo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumHozzaszolas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bejegyzes_id` INTEGER NOT NULL,
    `felhasznalo_id` INTEGER NOT NULL,
    `tartalom` TEXT NOT NULL,
    `letrehozva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_hozzaszolas_bejegyzes`(`bejegyzes_id`),
    INDEX `idx_hozzaszolas_felhasznalo`(`felhasznalo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumHozzaszolasReakcio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hozzaszolas_id` INTEGER NOT NULL,
    `felhasznalo_id` INTEGER NOT NULL,
    `emoji` VARCHAR(10) NOT NULL,

    INDEX `idx_comment_reakcio_hozzaszolas`(`hozzaszolas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumReport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `bejegyzes_id` INTEGER NULL,
    `hozzaszolas_id` INTEGER NULL,
    `tipus` VARCHAR(191) NOT NULL,
    `leiras` TEXT NULL,
    `kep_url` VARCHAR(500) NULL,
    `letrehozva` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `kezelt` BOOLEAN NOT NULL DEFAULT false,

    INDEX `idx_report_reporter`(`felhasznalo_id`),
    INDEX `idx_report_status`(`kezelt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumSzavazat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bejegyzes_id` INTEGER NOT NULL,
    `felhasznalo_id` INTEGER NOT NULL,
    `ertek` INTEGER NOT NULL,

    UNIQUE INDEX `ForumSzavazat_bejegyzes_id_felhasznalo_id_key`(`bejegyzes_id`, `felhasznalo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ForumReakcio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bejegyzes_id` INTEGER NOT NULL,
    `felhasznalo_id` INTEGER NOT NULL,
    `emoji` VARCHAR(10) NOT NULL,

    INDEX `idx_reakcio_bejegyzes`(`bejegyzes_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CensoredWord` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `CensoredWord_word_key`(`word`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_tiltva_eddig` ON `Felhasznalo`(`tiltva_eddig`);

-- AddForeignKey
ALTER TABLE `ForumBejegyzes` ADD CONSTRAINT `ForumBejegyzes_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumHozzaszolas` ADD CONSTRAINT `ForumHozzaszolas_bejegyzes_id_fkey` FOREIGN KEY (`bejegyzes_id`) REFERENCES `ForumBejegyzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumHozzaszolas` ADD CONSTRAINT `ForumHozzaszolas_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumHozzaszolasReakcio` ADD CONSTRAINT `ForumHozzaszolasReakcio_hozzaszolas_id_fkey` FOREIGN KEY (`hozzaszolas_id`) REFERENCES `ForumHozzaszolas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumHozzaszolasReakcio` ADD CONSTRAINT `ForumHozzaszolasReakcio_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReport` ADD CONSTRAINT `ForumReport_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReport` ADD CONSTRAINT `ForumReport_bejegyzes_id_fkey` FOREIGN KEY (`bejegyzes_id`) REFERENCES `ForumBejegyzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReport` ADD CONSTRAINT `ForumReport_hozzaszolas_id_fkey` FOREIGN KEY (`hozzaszolas_id`) REFERENCES `ForumHozzaszolas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumSzavazat` ADD CONSTRAINT `ForumSzavazat_bejegyzes_id_fkey` FOREIGN KEY (`bejegyzes_id`) REFERENCES `ForumBejegyzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumSzavazat` ADD CONSTRAINT `ForumSzavazat_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReakcio` ADD CONSTRAINT `ForumReakcio_bejegyzes_id_fkey` FOREIGN KEY (`bejegyzes_id`) REFERENCES `ForumBejegyzes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ForumReakcio` ADD CONSTRAINT `ForumReakcio_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

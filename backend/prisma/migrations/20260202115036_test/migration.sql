-- CreateTable
CREATE TABLE `Felhasznalo` (
    `felhasznalo_id` INTEGER NOT NULL AUTO_INCREMENT,
    `jelszo` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `felhasznalonev` VARCHAR(191) NOT NULL,
    `profilkep` VARCHAR(191) NULL,

    UNIQUE INDEX `Felhasznalo_email_key`(`email`),
    UNIQUE INDEX `Felhasznalo_felhasznalonev_key`(`felhasznalonev`),
    INDEX `idx_email`(`email`),
    INDEX `idx_felhasznalonev`(`felhasznalonev`),
    PRIMARY KEY (`felhasznalo_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebAruhaz` (
    `webaruhaz_id` INTEGER NOT NULL AUTO_INCREMENT,
    `url` VARCHAR(191) NOT NULL,
    `nev` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `WebAruhaz_url_key`(`url`),
    INDEX `idx_url`(`url`),
    PRIMARY KEY (`webaruhaz_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Termek` (
    `termek_id` INTEGER NOT NULL AUTO_INCREMENT,
    `cim` VARCHAR(500) NOT NULL,
    `tipus` ENUM('konyv', 'e_konyv', 'manga', 'kepregeny', 'hangoskonyv') NOT NULL,
    `szerzo` VARCHAR(255) NULL,
    `isbn_issn` VARCHAR(20) NULL,

    INDEX `idx_tipus`(`tipus`),
    INDEX `idx_szerzo`(`szerzo`),
    INDEX `idx_isbn_issn`(`isbn_issn`),
    PRIMARY KEY (`termek_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Keres` (
    `keres_id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `webaruhaz_id` INTEGER NOT NULL,

    INDEX `idx_felhasznalo`(`felhasznalo_id`),
    INDEX `idx_webaruhaz`(`webaruhaz_id`),
    PRIMARY KEY (`keres_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Kedvencek` (
    `kedvencek_id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `termek_id` INTEGER NOT NULL,

    INDEX `idx_felhasznalo`(`felhasznalo_id`),
    INDEX `idx_termek`(`termek_id`),
    UNIQUE INDEX `Kedvencek_felhasznalo_id_termek_id_key`(`felhasznalo_id`, `termek_id`),
    PRIMARY KEY (`kedvencek_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feljegyzes` (
    `feljegyzes_id` INTEGER NOT NULL AUTO_INCREMENT,
    `termek_id` INTEGER NOT NULL,
    `webaruhaz_id` INTEGER NOT NULL,

    INDEX `idx_termek`(`termek_id`),
    INDEX `idx_webaruhaz`(`webaruhaz_id`),
    UNIQUE INDEX `Feljegyzes_termek_id_webaruhaz_id_key`(`termek_id`, `webaruhaz_id`),
    PRIMARY KEY (`feljegyzes_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Arak` (
    `arak_id` INTEGER NOT NULL AUTO_INCREMENT,
    `kedvencek_id` INTEGER NOT NULL,
    `webaruhaz_id` INTEGER NOT NULL,
    `last_known_price` DECIMAL(10, 2) NOT NULL,

    INDEX `idx_kedvencek`(`kedvencek_id`),
    INDEX `idx_webaruhaz`(`webaruhaz_id`),
    PRIMARY KEY (`arak_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ar_Tortenet` (
    `ar_id` INTEGER NOT NULL AUTO_INCREMENT,
    `feljegyzes_id` INTEGER NOT NULL,
    `ar` DECIMAL(10, 2) NOT NULL,
    `datum` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_feljegyzes`(`feljegyzes_id`),
    INDEX `idx_datum`(`datum`),
    PRIMARY KEY (`ar_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Keres` ADD CONSTRAINT `Keres_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Keres` ADD CONSTRAINT `Keres_webaruhaz_id_fkey` FOREIGN KEY (`webaruhaz_id`) REFERENCES `WebAruhaz`(`webaruhaz_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kedvencek` ADD CONSTRAINT `Kedvencek_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Kedvencek` ADD CONSTRAINT `Kedvencek_termek_id_fkey` FOREIGN KEY (`termek_id`) REFERENCES `Termek`(`termek_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feljegyzes` ADD CONSTRAINT `Feljegyzes_termek_id_fkey` FOREIGN KEY (`termek_id`) REFERENCES `Termek`(`termek_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feljegyzes` ADD CONSTRAINT `Feljegyzes_webaruhaz_id_fkey` FOREIGN KEY (`webaruhaz_id`) REFERENCES `WebAruhaz`(`webaruhaz_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Arak` ADD CONSTRAINT `Arak_kedvencek_id_fkey` FOREIGN KEY (`kedvencek_id`) REFERENCES `Kedvencek`(`kedvencek_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Arak` ADD CONSTRAINT `Arak_webaruhaz_id_fkey` FOREIGN KEY (`webaruhaz_id`) REFERENCES `WebAruhaz`(`webaruhaz_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ar_Tortenet` ADD CONSTRAINT `Ar_Tortenet_feljegyzes_id_fkey` FOREIGN KEY (`feljegyzes_id`) REFERENCES `Feljegyzes`(`feljegyzes_id`) ON DELETE CASCADE ON UPDATE CASCADE;

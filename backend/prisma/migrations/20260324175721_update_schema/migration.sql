-- CreateTable
CREATE TABLE `CachedPrice` (
    `isbn` VARCHAR(20) NOT NULL,
    `data` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`isbn`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Wishlist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `felhasznalo_id` INTEGER NOT NULL,
    `book_id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `author` VARCHAR(255) NULL,
    `coverUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_wishlist_felhasznalo`(`felhasznalo_id`),
    UNIQUE INDEX `Wishlist_felhasznalo_id_book_id_key`(`felhasznalo_id`, `book_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Wishlist` ADD CONSTRAINT `Wishlist_felhasznalo_id_fkey` FOREIGN KEY (`felhasznalo_id`) REFERENCES `Felhasznalo`(`felhasznalo_id`) ON DELETE CASCADE ON UPDATE CASCADE;

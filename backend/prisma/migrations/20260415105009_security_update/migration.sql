/*
  Warnings:

  - A unique constraint covering the columns `[nev]` on the table `Szerzo` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `felhasznalo` ADD COLUMN `szerepkor` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE UNIQUE INDEX `Szerzo_nev_key` ON `Szerzo`(`nev`);

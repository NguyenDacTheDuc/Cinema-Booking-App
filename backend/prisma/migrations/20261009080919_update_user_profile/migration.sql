/*
  Warnings:

  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `fullName` VARCHAR(100) NOT NULL,
    MODIFY `gender` VARCHAR(10) NULL,
    MODIFY `dateOfBirth` DATE NULL;

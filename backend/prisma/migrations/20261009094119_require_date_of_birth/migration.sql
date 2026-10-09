/*
  Warnings:

  - Made the column `dateOfBirth` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `dateOfBirth` DATE NOT NULL;

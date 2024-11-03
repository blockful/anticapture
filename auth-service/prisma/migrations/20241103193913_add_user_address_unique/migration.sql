/*
  Warnings:

  - You are about to drop the `DAO` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[address]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_daoId_fkey";

-- DropTable
DROP TABLE "DAO";

-- CreateIndex
CREATE UNIQUE INDEX "User_address_key" ON "User"("address");

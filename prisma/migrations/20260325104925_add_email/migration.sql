/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `players` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `players` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "players" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "players_email_key" ON "players"("email");

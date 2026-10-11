-- AlterEnum
ALTER TYPE "DealStage" ADD VALUE 'INNKOMMENDE';

-- CreateTable
CREATE TABLE "BotApiKey" (
    "id" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdById" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiRateBucket" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApiRateBucket_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateIndex
CREATE UNIQUE INDEX "BotApiKey_navn_key" ON "BotApiKey"("navn");

-- CreateIndex
CREATE UNIQUE INDEX "BotApiKey_hash_key" ON "BotApiKey"("hash");

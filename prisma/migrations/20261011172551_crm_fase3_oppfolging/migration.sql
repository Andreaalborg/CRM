-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('UTKAST', 'SENDT', 'HOPPET_OVER', 'STOPPET', 'FEILET');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "slettesDato" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "OutreachDraft" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "steg" INTEGER NOT NULL,
    "til" TEXT NOT NULL,
    "emne" TEXT NOT NULL,
    "tekst" TEXT NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'UTKAST',
    "planlagtFor" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "godkjentAvId" TEXT,
    "godkjentDato" TIMESTAMP(3),
    "sendtDato" TIMESTAMP(3),
    "providerId" TEXT,
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "feil" TEXT,
    "stoppGrunn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suppression" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "grunn" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suppression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachDraft_token_key" ON "OutreachDraft"("token");

-- CreateIndex
CREATE INDEX "OutreachDraft_status_planlagtFor_idx" ON "OutreachDraft"("status", "planlagtFor");

-- CreateIndex
CREATE INDEX "OutreachDraft_sendtDato_idx" ON "OutreachDraft"("sendtDato");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachDraft_dealId_steg_key" ON "OutreachDraft"("dealId", "steg");

-- CreateIndex
CREATE UNIQUE INDEX "Suppression_hash_key" ON "Suppression"("hash");

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDraft" ADD CONSTRAINT "OutreachDraft_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

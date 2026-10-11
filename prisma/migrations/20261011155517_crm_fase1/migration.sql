-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('KVALIFISERT', 'GODKJENT', 'KONTAKTET', 'SVART', 'MOTE', 'TILBUD', 'VUNNET', 'TAPT', 'PAUSE');

-- CreateEnum
CREATE TYPE "DealKilde" AS ENUM ('LEAD_APP', 'NETTSIDE', 'HENVISNING', 'ANNET');

-- CreateEnum
CREATE TYPE "Pakke" AS ENUM ('STARTER', 'VEKST', 'PREMIUM', 'EGENDEFINERT');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('NOTAT', 'EPOST', 'TELEFON', 'MOTE', 'STEG', 'SYSTEM');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "orgnr" TEXT,
    "navn" TEXT NOT NULL,
    "orgform" TEXT,
    "bransje" TEXT,
    "naceKode" TEXT,
    "kommune" TEXT,
    "nettside" TEXT,
    "generiskEpost" TEXT,
    "telefon" TEXT,
    "ansatte" INTEGER,
    "rodtFlagg" TEXT,
    "svakheter" TEXT,
    "salgsvinkel" TEXT,
    "demoUrl" TEXT,
    "notater" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "navn" TEXT NOT NULL,
    "rolle" TEXT,
    "epost" TEXT,
    "telefon" TEXT,
    "notater" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tittel" TEXT NOT NULL,
    "stage" "DealStage" NOT NULL DEFAULT 'KVALIFISERT',
    "position" INTEGER NOT NULL DEFAULT 0,
    "sannsynlighet" INTEGER NOT NULL DEFAULT 10,
    "sannsynlighetKilde" TEXT NOT NULL DEFAULT 'stage-default',
    "verdi" INTEGER,
    "oppstartTotal" INTEGER,
    "maanedspris" INTEGER,
    "pakke" "Pakke",
    "kilde" "DealKilde" NOT NULL DEFAULT 'ANNET',
    "eierId" TEXT,
    "nesteSteg" TEXT,
    "nesteStegDato" TIMESTAMP(3),
    "sistKontakt" TIMESTAMP(3),
    "forventetLukkedato" TIMESTAMP(3),
    "tilbudSendtDato" TIMESTAMP(3),
    "signertDato" TIMESTAMP(3),
    "tapsarsak" TEXT,
    "innvendinger" TEXT,
    "godkjentAvId" TEXT,
    "godkjentDato" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dealId" TEXT,
    "type" "CrmActivityType" NOT NULL DEFAULT 'NOTAT',
    "tekst" TEXT NOT NULL,
    "userId" TEXT,
    "kilde" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "tittel" TEXT NOT NULL,
    "forfall" TIMESTAMP(3) NOT NULL,
    "ferdig" TIMESTAMP(3),
    "companyId" TEXT,
    "dealId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyTag" (
    "companyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyTag_pkey" PRIMARY KEY ("companyId","tagId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_orgnr_key" ON "Company"("orgnr");

-- CreateIndex
CREATE INDEX "Company_navn_idx" ON "Company"("navn");

-- CreateIndex
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");

-- CreateIndex
CREATE INDEX "Deal_companyId_idx" ON "Deal"("companyId");

-- CreateIndex
CREATE INDEX "Deal_stage_position_idx" ON "Deal"("stage", "position");

-- CreateIndex
CREATE INDEX "Deal_nesteStegDato_idx" ON "Deal"("nesteStegDato");

-- CreateIndex
CREATE INDEX "CrmActivity_companyId_createdAt_idx" ON "CrmActivity"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "CrmActivity_dealId_idx" ON "CrmActivity"("dealId");

-- CreateIndex
CREATE INDEX "CrmTask_forfall_ferdig_idx" ON "CrmTask"("forfall", "ferdig");

-- CreateIndex
CREATE INDEX "CompanyTag_tagId_idx" ON "CompanyTag"("tagId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTag" ADD CONSTRAINT "CompanyTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyTag" ADD CONSTRAINT "CompanyTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

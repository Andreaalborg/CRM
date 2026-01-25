# Database-oppdatering Guide

Denne guiden forklarer hvordan du oppdaterer databasen når du legger til nye tabeller eller felt i Prisma-skjemaet.

---

## Metode 1: Kjør Prisma lokalt med Vercel-URL (Anbefalt)

### Steg 1: Finn DATABASE_URL fra Supabase
1. Gå til [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg prosjektet ditt
3. Gå til **Settings** → **Database**
4. Under **Connection string** velg **Transaction pooler** (viktig for serverless!)
5. Kopier connection string og erstatt `[YOUR-PASSWORD]` med ditt passord

### Steg 2: Kjør kommandoen
```bash
# I terminalen (fra prosjektmappen):
DATABASE_URL="din-connection-string-her" npx prisma db push
```

Eksempel:
```bash
DATABASE_URL="postgresql://postgres.ewxmfxzaswqevbpimqeq:DITT_PASSORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true" npx prisma db push
```

---

## Metode 2: Kjør SQL direkte i Supabase

Hvis Prisma ikke fungerer, kan du kjøre SQL manuelt:

### Steg 1: Generer SQL fra Prisma
```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > migration.sql
```

### Steg 2: Kjør SQL i Supabase
1. Gå til [Supabase Dashboard](https://supabase.com/dashboard)
2. Velg prosjektet ditt
3. Gå til **SQL Editor**
4. Lim inn SQL-koden og klikk **Run**

---

## Metode 3: Bruk Prisma Migrate (for produksjon)

For mer kontrollerte migrasjoner:

```bash
# Opprett migrasjon
npx prisma migrate dev --name beskrivende_navn

# Deploy til produksjon
DATABASE_URL="din-vercel-url" npx prisma migrate deploy
```

---

## Viktige tips

### ⚠️ IKKE gjør dette i Vercel build:
```json
// IKKE GJØR DETTE - kan henge!
"build": "prisma db push && next build"
```

### ✅ Riktig build-script:
```json
"build": "prisma generate && next build"
```

### Sjekk database-status:
```bash
npx prisma db pull  # Hent eksisterende skjema fra database
npx prisma studio   # Åpne visuell database-editor
```

---

## SQL for gjentakende fakturaer (Recurring Invoices)

Hvis du trenger å legge til recurring invoices tabellene manuelt:

```sql
-- Opprett enum for recurring interval
DO $$ BEGIN
    CREATE TYPE "RecurringInterval" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Opprett enum for recurring status  
DO $$ BEGIN
    CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Opprett RecurringInvoice tabell
CREATE TABLE IF NOT EXISTS "RecurringInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerCity" TEXT,
    "customerPostalCode" TEXT,
    "customerCountry" TEXT DEFAULT 'Norge',
    "customerOrgNumber" TEXT,
    "interval" "RecurringInterval" NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "nextInvoiceDate" TIMESTAMP(3) NOT NULL,
    "lastInvoiceDate" TIMESTAMP(3),
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 25,
    "vatAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentDueDays" INTEGER NOT NULL DEFAULT 14,
    "bankAccount" TEXT,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
    "invoicesGenerated" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringInvoice_pkey" PRIMARY KEY ("id")
);

-- Opprett RecurringInvoiceLog tabell
CREATE TABLE IF NOT EXISTS "RecurringInvoiceLog" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringInvoiceLog_pkey" PRIMARY KEY ("id")
);

-- Legg til type-felt i InvoiceEmailLog (hvis tabellen finnes)
ALTER TABLE "InvoiceEmailLog" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'invoice';

-- Opprett indekser
CREATE INDEX IF NOT EXISTS "RecurringInvoice_organizationId_idx" ON "RecurringInvoice"("organizationId");
CREATE INDEX IF NOT EXISTS "RecurringInvoice_status_idx" ON "RecurringInvoice"("status");
CREATE INDEX IF NOT EXISTS "RecurringInvoice_nextInvoiceDate_idx" ON "RecurringInvoice"("nextInvoiceDate");
CREATE INDEX IF NOT EXISTS "RecurringInvoiceLog_recurringInvoiceId_idx" ON "RecurringInvoiceLog"("recurringInvoiceId");

-- Legg til foreign key
ALTER TABLE "RecurringInvoiceLog" 
DROP CONSTRAINT IF EXISTS "RecurringInvoiceLog_recurringInvoiceId_fkey";

ALTER TABLE "RecurringInvoiceLog" 
ADD CONSTRAINT "RecurringInvoiceLog_recurringInvoiceId_fkey" 
FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Feilsøking

### "Can't reach database server"
- Sjekk at du bruker **Transaction pooler** URL, ikke direct URL
- Sjekk at passordet er riktig
- Sjekk at IP-adressen din ikke er blokkert

### "Prisma db push henger"
- Kjør med `--accept-data-loss` flagget: `npx prisma db push --accept-data-loss`
- Eller bruk SQL-metoden i stedet

### "Table already exists"
- Bruk `IF NOT EXISTS` i SQL
- Eller kjør `npx prisma db pull` først for å synkronisere





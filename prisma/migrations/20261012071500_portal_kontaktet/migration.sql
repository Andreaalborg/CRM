-- Trinn 1: status «Kontaktet» i kundeportalen.
-- Bare additivt: ny nullable kolonne, ingen default, ingen omskriving av eksisterende rader (trygg på levende tabell).
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "contactedAt" TIMESTAMP(3);

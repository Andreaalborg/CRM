import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ownerAllowed } from "../email-guard";

test("interne varsler: bare eierens egne adresser", () => {
  const owners = ["andreaalborg@intellisenseai.no", "andre@test.no"];
  assert.ok(ownerAllowed(" AndreAalborg@IntelliSenseAI.no ", owners));
  assert.ok(!ownerAllowed("kunde@firma.no", owners));
  assert.ok(!ownerAllowed("", owners));
});

test("gamle automasjoner: hvert sendEmail-kall er bak eier-sjekk; SEND_EMAIL sender aldri", () => {
  for (const f of ["src/lib/automations.ts", "src/app/api/cron/process-jobs/route.ts"]) {
    const lines = readFileSync(f, "utf8").split("\n");
    lines.forEach((l, i) => {
      if (/\bsendEmail\(/.test(l)) assert.ok(lines.slice(Math.max(0, i - 8), i).some((x) => /isOwnerAddress\(/.test(x)), `${f}:${i + 1} sender uten eier-sjekk`);
    });
    assert.match(readFileSync(f, "utf8"), /status: "SKIPPED"/);
  }
});

test("ingen andre kodeveier kaller Resend enn de godkjente", () => {
  const allowed = new Set([
    "src/lib/email.ts", // selve klienten
    "src/lib/crm/mailer.ts", // fase 3, bare via Andrés Send-klikk
    "src/lib/automations.ts", "src/app/api/cron/process-jobs/route.ts", // kun interne varsler til eier (sjekket over)
    "src/app/api/auth/forgot-password/route.ts", // til brukeren selv
    "src/app/api/invoices/[invoiceId]/send/route.ts", // admin-klikk «Send faktura»
  ]);
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const hits = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && !f.endsWith(".test.ts"))
    .filter((f) => /\bsendEmail\(|resend\.emails|api\.resend\.com\/emails/.test(readFileSync(f, "utf8")));
  assert.deepEqual(hits.filter((f) => !allowed.has(f)), []);
});

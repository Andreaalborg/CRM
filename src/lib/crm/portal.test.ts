import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { submissionWhere, notificationRecipients, toCsv, csvCell, hashLoginToken, newLoginToken, tokenUsable, fieldLabel, formatValue, summary } from "../portal/core";

test("isolasjon: where har alltid organizationId, og kan ikke overstyres av filter", () => {
  const w = submissionWhere("org_A", { status: "ny", formId: "f1", fra: "2026-10-01", til: "2026-10-31" }) as Record<string, unknown>;
  assert.equal(w.organizationId, "org_A");
  assert.throws(() => submissionWhere("", {}));
  assert.equal((submissionWhere("org_A", { organizationId: "org_B" } as never) as Record<string, unknown>).organizationId, "org_A");
});
test("isolasjon: alle portalsider/-ruter henter data via requireCustomer + orgId", () => {
  for (const f of ["src/app/(customer)/customer/page.tsx", "src/app/(customer)/customer/leads/page.tsx", "src/app/(customer)/customer/leads/[id]/page.tsx", "src/app/(customer)/customer/leads/export/route.ts", "src/app/(customer)/customer/settings/page.tsx"]) {
    const s = readFileSync(f, "utf8");
    assert.match(s, /requireCustomer\(/, f);
    for (const m of s.matchAll(/db\.submission\.\w+\(\{ where: ([^,}]+)/g)) assert.match(m[1], /submissionWhere\(c\.orgId|^\{ id\b/, `${f}: ${m[1]}`);
  }
});
test("varsel: bare egne kundebrukere med varsel PÅ (av som standard)", () => {
  const users = [
    { email: "a@kunde.no", role: "CUSTOMER", organizationId: "A", notifyNewSubmissions: true },
    { email: "b@kunde.no", role: "CUSTOMER", organizationId: "A", notifyNewSubmissions: false },
    { email: "c@annen.no", role: "CUSTOMER", organizationId: "B", notifyNewSubmissions: true },
    { email: "admin@x.no", role: "SUPER_ADMIN", organizationId: "A", notifyNewSubmissions: true },
  ];
  assert.deepEqual(notificationRecipients(users, "A"), ["a@kunde.no"]);
  assert.match(readFileSync("prisma/schema.prisma", "utf8"), /notifyNewSubmissions Boolean @default\(false\)/);
  assert.match(readFileSync("src/lib/portal/notify.ts", "utf8"), /emailHealth\(\)/);
});
test("magisk lenke: bare hash lagres, engangs og utløper", () => {
  const { token, hash } = newLoginToken();
  assert.equal(hash, hashLoginToken(token)); assert.ok(token.length >= 40); assert.notEqual(hash, token);
  const now = new Date();
  assert.ok(tokenUsable({ expiresAt: new Date(now.getTime() + 1000), usedAt: null }, now));
  assert.ok(!tokenUsable({ expiresAt: new Date(now.getTime() + 1000), usedAt: now }, now));
  assert.ok(!tokenUsable({ expiresAt: new Date(now.getTime() - 1), usedAt: null }, now));
  assert.ok(!tokenUsable(null));
});
test("CSV: samme rader, semikolon, BOM, vern mot formel-injeksjon", () => {
  const csv = toCsv([{ createdAt: new Date("2026-10-11T10:00:00Z"), form: "Kontakt", status: "Ny", data: { navn: "Kari", melding: "Hei; \"test\"", x: "=HYPERLINK()" } }]);
  assert.ok(csv.startsWith("\uFEFF")); const lines = csv.slice(1).split("\r\n");
  assert.equal(lines.length, 2); assert.match(lines[0], /^Dato;Skjema;Status;Navn;Melding;X;Notat$/);
  assert.match(lines[1], /"Hei; ""test"""/); assert.equal(csvCell("=1+1"), "'=1+1");
});
test("formatering av felt", () => {
  assert.equal(fieldLabel("epost"), "E-post"); assert.equal(fieldLabel("antall_ansatte"), "Antall ansatte");
  assert.equal(formatValue(true), "Ja"); assert.equal(formatValue(["a", "b"]), "a, b");
  assert.equal(summary({ fornavn: "Ola", etternavn: "N", email: "o@n.no" }).navn, "Ola N");
});

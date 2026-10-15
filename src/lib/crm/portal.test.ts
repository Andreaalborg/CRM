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

import { portalStatus, replyMailto, portalNotifyGate, alertContent } from "../portal/core";
test("trinn 1: status Ny → Kontaktet → Håndtert", () => {
  assert.equal(portalStatus({ handledAt: null, contactedAt: null }), "ny");
  assert.equal(portalStatus({ handledAt: null, contactedAt: new Date() }), "kontaktet");
  assert.equal(portalStatus({ handledAt: new Date(), contactedAt: new Date() }), "handtert");
  const w = submissionWhere("o", { status: "kontaktet" }) as Record<string, unknown>;
  assert.deepEqual([w.handledAt, w.contactedAt], [null, { not: null }]);
  assert.equal((submissionWhere("o", { status: "ny" }) as Record<string, unknown>).contactedAt, null);
});
test("trinn 1: Svar = mailto med Re: og sitert melding", () => {
  const m = replyMailto({ data: { navn: "Kari Nordmann", epost: "kari@x.no", melding: "Hei\nKan dere ringe?" }, formName: "Kontaktskjema", createdAt: new Date("2026-10-12T08:00:00Z") })!;
  assert.ok(m.startsWith("mailto:kari@x.no?subject="));
  const u = new URL(m);
  assert.equal(u.searchParams.get("subject"), "Re: Kontaktskjema – Kari Nordmann");
  assert.match(u.searchParams.get("body")!, /skrev Kari Nordmann:\n> Hei\n> Kan dere ringe\?/);
  assert.ok(!m.includes("+"));
  assert.equal(replyMailto({ data: { navn: "X", epost: "ikke-epost" }, formName: "F", createdAt: new Date() }), null);
  assert.equal(replyMailto({ data: { navn: "X", epost: "a@b.no?cc=c@d.no" }, formName: "F", createdAt: new Date() }), null);
});
test("trinn 1: varsel er AV uten PORTAL_NOTIFY_ENABLED=1 og grønn e-posthelse", () => {
  const ok = { ok: true, dryRun: false, reasons: [] };
  assert.equal(portalNotifyGate({}, ok).on, false);
  assert.equal(portalNotifyGate({ PORTAL_NOTIFY_ENABLED: "1" }, { ok: false, dryRun: false, reasons: ["domene ikke verifisert"] }).on, false);
  assert.equal(portalNotifyGate({ PORTAL_NOTIFY_ENABLED: "1" }, { ...ok, dryRun: true }).on, false);
  assert.equal(portalNotifyGate({ PORTAL_NOTIFY_ENABLED: "1" }, ok).on, true);
});
test("trinn 1: varselinnhold har sammendrag og lenke, og escaper HTML", () => {
  const a = alertContent({ id: "s1", formName: "Kontakt", data: { navn: "<b>Ola</b>", epost: "o@x.no", melding: "Trenger tilbud" }, baseUrl: "https://crm.intellisenseai.no/" });
  assert.equal(a.url, "https://crm.intellisenseai.no/customer/leads/s1");
  assert.match(a.text, /Melding: Trenger tilbud/);
  assert.ok(!a.html.includes("<b>Ola"));
});

import { decide } from "../../proxy";
import { osloStamp } from "../portal/core";
import { appBaseUrl, CANONICAL_BASE_URL } from "../base-url";
test("feilrettinger: kundebrukere kommer ikke inn i /dashboard eller interne API-er", () => {
  for (const p of ["/dashboard", "/dashboard/forms", "/dashboard/leads/abc", "/dashboard/automations", "/dashboard/emails", "/dashboard/settings"]) {
    assert.equal(decide(p, "CUSTOMER"), "to-customer", p);
    assert.equal(decide(p, undefined), "to-customer", p);
    assert.equal(decide(p, "SUPER_ADMIN"), "ok", p);
  }
  for (const p of ["/api/leads/x/status", "/api/forms", "/api/forms/f1", "/api/automations", "/api/admin/customers/x"]) assert.equal(decide(p, "CUSTOMER"), "forbidden", p);
  assert.equal(decide("/api/forms/f1/submit", "CUSTOMER"), "ok");
  assert.equal(decide("/customer/leads", "CUSTOMER"), "ok");
});
test("feilrettinger: e-post/navn/telefon finnes via felttype eller form, ikke bare label", () => {
  const fields = [{ name: "field_afbq", label: "Field afbq", type: "EMAIL" }, { name: "field_x1", label: "Ditt navn", type: "TEXT" }, { name: "field_p9", label: "Field p9", type: "PHONE" }];
  const s = summary({ field_x1: "Kari Nordmann", field_afbq: "kari@x.no", field_p9: "91 23 45 67" }, fields);
  assert.deepEqual(s, { navn: "Kari Nordmann", epost: "kari@x.no", telefon: "91 23 45 67" });
  // uten skjemafelt: gjenkjenn på verdiens form
  const t = summary({ field_a: "Ola Hansen", field_b: "ola@x.no", field_c: "+47 900 00 001", field_d: "Lang melding\nmed linjeskift" });
  assert.deepEqual(t, { navn: "Ola Hansen", epost: "ola@x.no", telefon: "+47 900 00 001" });
  assert.ok(replyMailto({ data: { field_afbq: "kari@x.no", field_x1: "Kari" }, formName: "F", createdAt: new Date(), fields })!.startsWith("mailto:kari@x.no"));
  assert.equal(fieldLabel("field_x1", fields), "Ditt navn");
});
test("feilrettinger: CSV bruker feltetiketter og Oslo-tid", () => {
  const csv = toCsv([{ createdAt: new Date("2026-10-12T05:13:00Z"), form: "K", status: "Ny", data: { field_x1: "Kari" } }], [{ name: "field_x1", label: "Ditt navn", type: "TEXT" }]);
  assert.match(csv, /Dato;Skjema;Status;Ditt navn;Notat/);
  assert.match(csv, /2026-10-12 07:13;K;Ny;Kari/);
  assert.equal(osloStamp(new Date("2026-01-15T23:30:00Z")), "2026-01-16 00:30");
});
test("feilrettinger: innloggingslenker bruker kanonisk base-URL, aldri vercel.app/NEXTAUTH_URL", () => {
  const old = { a: process.env.CRM_PUBLIC_URL, b: process.env.NEXTAUTH_URL };
  delete process.env.CRM_PUBLIC_URL; process.env.NEXTAUTH_URL = "https://crm-git-main-x.vercel.app";
  assert.equal(appBaseUrl(), CANONICAL_BASE_URL);
  process.env.CRM_PUBLIC_URL = "https://crm.example.no/"; assert.equal(appBaseUrl(), "https://crm.example.no");
  if (old.a === undefined) delete process.env.CRM_PUBLIC_URL; else process.env.CRM_PUBLIC_URL = old.a;
  if (old.b === undefined) delete process.env.NEXTAUTH_URL; else process.env.NEXTAUTH_URL = old.b;
});

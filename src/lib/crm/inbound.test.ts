// Tester for henvendelses-flyten: rene funksjoner + integrasjon mot LOKAL engangs-Postgres (hoppes over ellers).
// Verifiserer: idempotens, auto-svar filtrert, kilde-merking, varsel låst til eier og bak flagg, ingen utgående HTTP, inbox-status, retention (tørrkjøring).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { workMinutesBetween, kildeKategori, isAutoSender } from "./inbox-status";
import { signBody, hashApiKey } from "./apikey";

const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "") && !process.env.NEON_DATABASE_URL;
const SECRET = "test-secret-0123456789abcdef";
const T = "TESTINBOUND";

test("arbeidstid Oslo: man–fre 08–17, helg og natt teller ikke", () => {
  // fre 16.10.2026 15:00 Oslo (13:00Z) → man 19.10 09:00 Oslo (07:00Z): 2t fre + 1t man = 180 min
  assert.equal(workMinutesBetween(new Date("2026-10-16T13:00:00Z"), new Date("2026-10-19T07:00:00Z")), 180);
  assert.equal(workMinutesBetween(new Date("2026-10-17T08:00:00Z"), new Date("2026-10-18T20:00:00Z")), 0);
  assert.equal(workMinutesBetween(new Date("2026-10-14T05:00:00Z"), new Date("2026-10-14T15:30:00Z")), 9 * 60); // ons 07–17:30 Oslo → 08–17
  assert.equal(workMinutesBetween(new Date("2026-10-16T10:00:00Z"), new Date("2026-10-16T09:00:00Z")), 0);
  // sommertid→vintertid (25.10.2026): søn → ingen effekt, men man 26.10 08–10 Oslo (vintertid, UTC+1)
  assert.equal(workMinutesBetween(new Date("2026-10-26T06:00:00Z"), new Date("2026-10-26T09:00:00Z")), 120);
});
test("kilde-kategori og auto-svar", () => {
  assert.equal(kildeKategori("nettside/kontakt"), "skjema");
  assert.equal(kildeKategori("nettside/epost#<abc@x>"), "epost_hei");
  assert.equal(kildeKategori("nettside/chat"), "chat");
  assert.equal(kildeKategori(null), "annet");
  assert.ok(isAutoSender("noreply@x.no")); assert.ok(isAutoSender("a@b.no", "auto-replied")); assert.ok(!isAutoSender("a@b.no", "no")); assert.ok(!isAutoSender("ola@b.no"));
});

test("inbound + inbox-status + retention (lokal DB)", { skip: !local && "DATABASE_URL er ikke lokal" }, async (t) => {
  const calls: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (u: string | URL | Request, i?: RequestInit) => { calls.push(String(u)); return realFetch(u, i); }) as typeof fetch;
  process.env.INBOUND_WEBHOOK_SECRET = SECRET;
  process.env.RESEND_API_KEY = "re_dummy"; process.env.EMAIL_FROM = "André <andreaalborg@intellisenseai.no>";
  const { db } = await import("@/lib/db");
  const inbound = await import("@/app/api/v1/inbound/route");
  const status = await import("@/app/api/v1/inbox-status/route");
  const { notifyRecipients, notifyOwnerNewInbound } = await import("./inbound-notify");
  const { inboundRetention } = await import("./inbound-retention");
  const cleanup = async () => { await db.company.deleteMany({ where: { OR: [{ navn: { startsWith: T } }, { generiskEpost: { endsWith: "@inbound-test.invalid" } }, { contacts: { some: { epost: { endsWith: "@inbound-test.invalid" } } } }] } }); await db.botApiKey.deleteMany({ where: { navn: T } }); };
  after(async () => { await cleanup(); globalThis.fetch = realFetch; await db.$disconnect(); });
  await cleanup();
  const post = (b: object, headers: Record<string, string> = {}) => {
    const body = JSON.stringify(b); const ts = String(Math.floor(Date.now() / 1000));
    return inbound.POST(new Request("http://x/api/v1/inbound", { method: "POST", body, headers: { "x-is-timestamp": ts, "x-is-signature": "sha256=" + signBody(SECRET, ts, body), ...headers } }));
  };

  await t.test("idempotens: samme ekstern_id gir ingen duplikat", async () => {
    const b = { kilde: "epost", navn: `${T} Ola`, epost: "ola@inbound-test.invalid", melding: "Hei", side: "e-post: Test", ekstern_id: "<msg-1@test>" };
    const r1 = await post(b); assert.equal(r1.status, 201);
    const r2 = await post(b); assert.equal(r2.status, 200); assert.equal((await r2.json()).idempotent, true);
    const [r3, r4] = await Promise.all([post({ ...b, ekstern_id: "<msg-2@test>" }), post({ ...b, ekstern_id: "<msg-2@test>" })]);
    assert.equal([await r3.json(), await r4.json()].filter((x) => x.idempotent).length, 1, "nøyaktig én av to samtidige er idempotent-treff");
    const acts = await db.crmActivity.findMany({ where: { kilde: { startsWith: "nettside/epost#" }, company: { contacts: { some: { epost: "ola@inbound-test.invalid" } } } } });
    assert.equal(acts.length, 2, "to unike meldinger, ingen duplikater");
    assert.equal(await db.deal.count({ where: { company: { contacts: { some: { epost: "ola@inbound-test.invalid" } } } } }), 1);
  });
  await t.test("kilde-merking og auto-svar", async () => {
    const d = await db.deal.findFirstOrThrow({ where: { company: { contacts: { some: { epost: "ola@inbound-test.invalid" } } } } });
    assert.match(d.tittel, /^E-post \(hei@\)/); assert.equal(d.stage, "INNKOMMENDE");
    const r = await post({ kilde: "epost", navn: "Robot", epost: "noreply@inbound-test.invalid", melding: "x", ekstern_id: "<auto>" });
    assert.equal((await r.json()).ignored, true);
    assert.equal(await db.contact.count({ where: { epost: "noreply@inbound-test.invalid" } }), 0);
    const bad = await inbound.POST(new Request("http://x", { method: "POST", body: "{}", headers: { "x-is-key": "feil-feil-feil-feil-feil" } })); assert.equal(bad.status, 401);
  });
  await t.test("varsel: av som standard, låst til eier, ingen utgående HTTP", async () => {
    delete process.env.INBOUND_NOTIFY_ENABLED;
    assert.equal((await notifyOwnerNewInbound({ kilde: "x", navn: null, side: null, utdrag: null, dealId: "d", duplicate: false })).reason, "flagg av");
    process.env.OWNER_NOTIFY_EMAILS = "kunde@ekstern.no, andreaalborg@intellisenseai.no";
    const rec = await notifyRecipients();
    assert.deepEqual(rec, ["andreaalborg@intellisenseai.no"], "ekstern adresse filtreres bort av email-guard");
    process.env.INBOUND_NOTIFY_ENABLED = "1"; process.env.OUTREACH_DRY_RUN = "1";
    assert.equal((await notifyOwnerNewInbound({ kilde: "x", navn: null, side: null, utdrag: null, dealId: "d", duplicate: false })).reason, "dry-run");
    await post({ kilde: "kontakt", navn: `${T} Kari`, epost: "kari@inbound-test.invalid", melding: "Hei", ekstern_id: "k1" });
    assert.equal(calls.filter((u) => /resend|api\./i.test(u)).length, 0, "ingen utgående kall (dry-run)");
    delete process.env.OUTREACH_DRY_RUN; delete process.env.INBOUND_NOTIFY_ENABLED;
    // flagg på, ikke dry-run, men dummy-nøkkel → helsesjekk stopper (ingen kall)
    process.env.INBOUND_NOTIFY_ENABLED = "1";
    assert.equal((await notifyOwnerNewInbound({ kilde: "x", navn: null, side: null, utdrag: null, dealId: "d", duplicate: false })).reason, "helsesjekk");
    assert.equal(calls.length, 0);
    delete process.env.INBOUND_NOTIFY_ENABLED;
  });
  await t.test("inbox-status: krever leads:read, ingen persondata", async () => {
    const key = "isk_testkey_" + "a".repeat(30);
    await db.botApiKey.create({ data: { navn: T, prefix: "isk_test", hash: hashApiKey(key), scopes: ["leads:read"] } });
    assert.equal((await status.GET(new Request("http://x"))).status, 401);
    const r = await status.GET(new Request("http://x", { headers: { authorization: `Bearer ${key}` } }));
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.ok(j.antall_ubehandlede >= 2, JSON.stringify(j.per_kilde)); assert.ok(j.per_kilde.epost_hei >= 1, JSON.stringify(j.per_kilde)); assert.ok(j.per_kilde.skjema >= 1, JSON.stringify(j.per_kilde));
    assert.deepEqual(Object.keys(j.henvendelser[0]).sort(), ["alder_arbeidstimer", "alder_minutter", "id", "kilde", "opprettet"]);
    assert.doesNotMatch(JSON.stringify(j), /inbound-test|Ola|Kari/);
    await db.botApiKey.update({ where: { navn: T }, data: { scopes: ["leads:write"] } });
    assert.equal((await status.GET(new Request("http://x", { headers: { authorization: `Bearer ${key}` } }))).status, 403);
  });
  await t.test("retention: tørrkjøring standard, sletter kun eldre enn 12 mnd uten VUNNET", async () => {
    const old = new Date(Date.now() - 400 * 86400_000);
    const mk = async (n: string, stage: "INNKOMMENDE" | "VUNNET") => {
      const c = await db.company.create({ data: { navn: `${T} ${n}`, deals: { create: { tittel: "x", stage } } } });
      await db.crmActivity.create({ data: { companyId: c.id, type: "EPOST", tekst: "x", kilde: "nettside/kontakt" } });
      await db.$executeRaw`UPDATE "Company" SET "createdAt"=${old} WHERE id=${c.id}`;
      await db.$executeRaw`UPDATE "CrmActivity" SET "createdAt"=${old} WHERE "companyId"=${c.id}`;
      await db.$executeRaw`UPDATE "Deal" SET "updatedAt"=${old} WHERE "companyId"=${c.id}`;
      return c.id;
    };
    const a = await mk("gammel", "INNKOMMENDE"), w = await mk("kunde", "VUNNET");
    const dry = await inboundRetention(new Date(), false);
    assert.ok(dry.dryRun && dry.ids.includes(a) && !dry.ids.includes(w)); assert.equal(dry.deleted, 0);
    assert.ok(await db.company.findUnique({ where: { id: a } }));
    const del = await inboundRetention(new Date(), true);
    assert.ok(del.deleted >= 1); assert.equal(await db.company.findUnique({ where: { id: a } }), null); assert.ok(await db.company.findUnique({ where: { id: w } }));
    // cron-rute: uten secret → 401
    const { GET } = await import("@/app/api/cron/inbound-retention/route");
    const { NextRequest } = await import("next/server");
    assert.equal((await GET(new NextRequest("http://x/api/cron/inbound-retention"))).status, 401);
  });
});

// Integrasjonstest mot LOKAL Postgres (hoppes over ellers). Verifiserer at cron aldri kaller Resend,
// avmeldingsflyten, GDPR-sletting etter 12 mnd + 1 dag (11 mnd overlever) og at ENK/personlige adresser ikke får utkast.
import { test, after } from "node:test";
import assert from "node:assert/strict";

const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "") && !process.env.NEON_DATABASE_URL;
const T = "TESTFASE3";

test("DB-integrasjon (lokal)", { skip: !local && "DATABASE_URL er ikke lokal" }, async (t) => {
  const calls: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (u: string | URL | Request, i?: RequestInit) => { calls.push(String(u)); return realFetch(u, i); }) as typeof fetch;
  const { db } = await import("@/lib/db");
  const { planOutreach, gdprSweep, unsubscribeByToken, isSuppressed } = await import("./outreach");
  after(async () => { await db.company.deleteMany({ where: { navn: { startsWith: T } } }); globalThis.fetch = realFetch; await db.$disconnect(); });
  await db.company.deleteMany({ where: { navn: { startsWith: T } } });

  const mk = async (navn: string, orgform: string, epost: string, orgnr: string) => db.company.create({
    data: { navn: `${T} ${navn}`, orgform, generiskEpost: epost, orgnr, demoUrl: "https://demo.example/x", svakheter: "Treg mobil\nMangler SSL",
      deals: { create: { tittel: "Ny nettside", stage: "GODKJENT", kilde: "LEAD_APP" } } },
    include: { deals: true },
  });
  const as = await mk("Rør AS", "AS", "post@ror-test.invalid", "990000001");
  const enk = await mk("Enk", "ENK", "post@enk-test.invalid", "990000002");
  const pers = await mk("Pers AS", "AS", "ola.nordmann@pers-test.invalid", "990000003");

  await t.test("cron lager dag-0-utkast kun for AS med generisk adresse – og kaller aldri Resend", async () => {
    await planOutreach(new Date());
    await gdprSweep(new Date());
    assert.equal(calls.filter((u) => /resend/i.test(u)).length, 0, "ingen kall til Resend");
    assert.equal(calls.length, 0, "cron gjør ingen utgående HTTP-kall i det hele tatt");
    const d = await db.outreachDraft.findMany({ where: { companyId: { in: [as.id, enk.id, pers.id] } } });
    assert.equal(d.length, 1); assert.equal(d[0].companyId, as.id); assert.equal(d[0].status, "UTKAST");
    assert.match(d[0].tekst, /Treg mobil/); assert.match(d[0].tekst, /demo\.example/); assert.doesNotMatch(d[0].tekst, /\{(firma|demo_url|svakhet)\}/);
    await planOutreach(new Date());
    assert.equal(await db.outreachDraft.count({ where: { companyId: as.id } }), 1, "idempotent");
  });

  await t.test("avmelding: sperrer e-post+orgnr, stopper utkast, flytter deal til Tapt", async () => {
    const d = (await db.outreachDraft.findFirst({ where: { companyId: as.id } }))!;
    assert.equal((await unsubscribeByToken("feil-token-xxxxxxxxxxxx")).ok, false);
    assert.equal((await unsubscribeByToken(d.token)).ok, true);
    assert.equal(await isSuppressed("POST@ror-test.invalid", null), true);
    assert.equal(await isSuppressed(null, "990000001"), true);
    assert.equal((await db.outreachDraft.findUnique({ where: { id: d.id } }))!.status, "STOPPET");
    assert.equal((await db.deal.findFirst({ where: { companyId: as.id } }))!.stage, "TAPT");
    assert.equal((await unsubscribeByToken(d.token)).ok, true, "idempotent");
  });

  await t.test("GDPR: lead med siste aktivitet for 12 mnd + 1 dag siden slettes; sperrelisten beholdes", async () => {
    const old = new Date(); old.setMonth(old.getMonth() - 12); old.setDate(old.getDate() - 1);
    const c = await db.company.create({ data: { navn: `${T} Gammel AS`, orgnr: "990000004", createdAt: old, deals: { create: { tittel: "x", stage: "PAUSE" } } } });
    await db.$executeRaw`UPDATE "Deal" SET "updatedAt" = ${old} WHERE "companyId" = ${c.id}`;
    const fresh = await db.company.create({ data: { navn: `${T} Fersk AS`, orgnr: "990000005" } });
    const elleve = new Date(); elleve.setMonth(elleve.getMonth() - 11);
    const c11 = await db.company.create({ data: { navn: `${T} Elleve AS`, orgnr: "990000006", createdAt: elleve, deals: { create: { tittel: "y", stage: "PAUSE" } } } });
    await db.$executeRaw`UPDATE "Deal" SET "updatedAt" = ${elleve} WHERE "companyId" = ${c11.id}`;
    const r = await gdprSweep(new Date());
    assert.ok(r.ids.includes(c.id));
    assert.ok(!r.ids.includes(c11.id), "11 mnd gammel lead beholdes (12 mnd gjelder)");
    assert.equal(await db.company.count({ where: { id: c11.id } }), 1);
    assert.equal(await db.company.count({ where: { id: c.id } }), 0);
    assert.equal(await db.company.count({ where: { id: fresh.id } }), 1);
    assert.ok((await db.company.findUnique({ where: { id: fresh.id } }))!.slettesDato! > new Date());
    assert.equal(await isSuppressed("post@ror-test.invalid", null), true, "sperrelisten overlever GDPR-sletting");
    await db.suppression.deleteMany({ where: { hash: { in: [(await import("./outreach-core")).suppressionHash("epost", "post@ror-test.invalid"), (await import("./outreach-core")).suppressionHash("orgnr", "990000001")] } } });
  });
});

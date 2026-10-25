// Fase 3 – planlegging av utkast og GDPR-opprydding. Kjøres av /api/cron/fase3.
// VIKTIG: Denne modulen sender ALDRI e-post og importerer verken mailer, Resend eller @/lib/email.
// (Sjekkes av outreach-core.test.ts.)
import { db } from "@/lib/db";
import { MALER } from "./maler";
import {
  nextAction, merge, svakhetTekst, newToken, suppressionHash, recipientBlockers, addMonths,
  SEQ_ACTIVE_STAGES, PAUSE_DAYS, GDPR_MONTHS,
} from "./outreach-core";

export async function isSuppressed(epost: string | null | undefined, orgnr: string | null | undefined): Promise<boolean> {
  const hashes = [epost && suppressionHash("epost", epost), orgnr && suppressionHash("orgnr", orgnr)].filter(Boolean) as string[];
  if (!hashes.length) return false;
  return (await db.suppression.count({ where: { hash: { in: hashes } } })) > 0;
}

export async function newContactsLast7d(now = new Date()): Promise<number> {
  return db.outreachDraft.count({ where: { steg: 0, status: "SENDT", sendtDato: { gte: new Date(now.getTime() - 7 * 86_400_000) } } });
}

/** Lager neste utkast, stopper sekvenser og setter Pause. Sender aldri. */
export async function planOutreach(now = new Date()) {
  const res = { created: 0, stopped: 0, paused: 0, skipped: 0 };
  const deals = await db.deal.findMany({
    where: { OR: [{ stage: { in: [...SEQ_ACTIVE_STAGES] } }, { outreach: { some: { status: "UTKAST" } } }] },
    include: { company: { include: { contacts: { take: 1, orderBy: { createdAt: "asc" } } } }, outreach: true },
  });
  for (const deal of deals) {
    const c = deal.company;
    const suppressed = await isSuppressed(c.generiskEpost, c.orgnr);
    const a = nextAction({ stage: deal.stage, suppressed, drafts: deal.outreach }, now);
    if (a.kind === "stop") {
      const r = await db.outreachDraft.updateMany({ where: { dealId: deal.id, status: "UTKAST" }, data: { status: "STOPPET", stoppGrunn: a.grunn } });
      res.stopped += r.count;
    } else if (a.kind === "pause") {
      const til = new Date(now.getTime() + PAUSE_DAYS * 86_400_000);
      await db.$transaction([
        db.deal.update({ where: { id: deal.id }, data: { stage: "PAUSE", nesteStegDato: til, nesteSteg: "Ny vurdering etter 90 dager uten svar" } }),
        db.crmActivity.create({ data: { companyId: c.id, dealId: deal.id, type: "SYSTEM", kilde: "cron-fase3", tekst: `Ingen svar etter dag 10 → Pause til ${til.toISOString().slice(0, 10)}` } }),
      ]);
      res.paused++;
    } else if (a.kind === "create") {
      // Lag bare utkast når mottakeren kan bli godkjent (permanente blokkeringer → ingen utkast). Ukegrensen sjekkes ved sending.
      const perm = recipientBlockers({ epost: c.generiskEpost, orgform: c.orgform, suppressed, steg: a.steg, newContactsLast7d: 0 });
      if (perm.length) { res.skipped++; continue; }
      const vars = { firma: c.navn, kontakt: c.contacts[0]?.navn?.split(" ")[0] ?? null /* tom → «dere» */, demo_url: c.demoUrl, svakhet: svakhetTekst(c.svakheter) };
      const mal = MALER[a.steg];
      await db.outreachDraft.create({
        data: {
          companyId: c.id, dealId: deal.id, steg: a.steg, til: c.generiskEpost!, emne: merge(mal.emne, vars), tekst: merge(mal.tekst, vars),
          planlagtFor: a.planlagtFor, token: newToken(),
        },
      }).then(() => res.created++).catch((e) => { if (!String(e).includes("Unique")) throw e; });
    }
  }
  return res;
}

/** GDPR: slettesDato = siste aktivitet + 12 mnd (GDPR_MONTHS). Leads uten vunnet deal slettes når datoen er passert. Sperrelisten beholdes. */
export async function gdprSweep(now = new Date()) {
  // Rå SQL så Company.updatedAt ikke endres (ellers ville sjekken flytte seg selv fremover).
  await db.$executeRaw`
    UPDATE "Company" c SET "slettesDato" = (GREATEST(
      c."createdAt",
      COALESCE((SELECT max(a."createdAt") FROM "CrmActivity" a WHERE a."companyId" = c.id), c."createdAt"),
      COALESCE((SELECT max(d."updatedAt") FROM "Deal" d WHERE d."companyId" = c.id), c."createdAt"),
      COALESCE((SELECT max(o."updatedAt") FROM "OutreachDraft" o WHERE o."companyId" = c.id), c."createdAt")
    ) + make_interval(months => ${GDPR_MONTHS}::int))`;
  const due = await db.company.findMany({
    where: { slettesDato: { lt: now }, deals: { none: { stage: "VUNNET" } } },
    select: { id: true },
  });
  if (due.length) await db.company.deleteMany({ where: { id: { in: due.map((d) => d.id) } } });
  return { deleted: due.length, ids: due.map((d) => d.id), checkedAt: now.toISOString(), cutoffExample: addMonths(now, -GDPR_MONTHS).toISOString() };
}

/** Avmelding via token (offentlig). Idempotent. */
export async function unsubscribeByToken(token: string): Promise<{ ok: boolean; firma?: string }> {
  if (!token || token.length < 16) return { ok: false };
  const d = await db.outreachDraft.findUnique({ where: { token }, include: { company: true, deal: true } });
  if (!d) return { ok: false };
  const entries = [{ hash: suppressionHash("epost", d.til), type: "epost" }];
  if (d.company.orgnr) entries.push({ hash: suppressionHash("orgnr", d.company.orgnr), type: "orgnr" });
  await db.$transaction(async (tx) => {
    for (const e of entries) await tx.suppression.upsert({ where: { hash: e.hash }, create: { ...e, grunn: "avmelding" }, update: {} });
    await tx.outreachDraft.updateMany({ where: { companyId: d.companyId, status: "UTKAST" }, data: { status: "STOPPET", stoppGrunn: "Avmeldt" } });
    const open = await tx.deal.findMany({ where: { companyId: d.companyId, stage: { in: [...SEQ_ACTIVE_STAGES] } } });
    for (const deal of open) await tx.deal.update({ where: { id: deal.id }, data: { stage: "TAPT", tapsarsak: "Avmeldt (e-post)" } });
    await tx.crmActivity.create({ data: { companyId: d.companyId, dealId: d.dealId, type: "SYSTEM", kilde: "avmelding", tekst: "Mottakeren meldte seg av. Lagt på sperrelisten for alltid; sekvensen er stoppet." } });
  });
  return { ok: true, firma: d.company.navn };
}

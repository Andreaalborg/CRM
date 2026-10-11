"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Prisma, type DealKilde, type Pakke, type CrmActivityType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  STAGE_LABEL, STAGE_DEFAULT_PROB, isStage, normalizeOrgnr, isValidOrgnr,
  validateStageChange, probabilityAfterMove, nextPosition, type Stage,
} from "./core";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") throw new Error("Ikke autorisert");
  return session.user;
}

/** Audit-logg på alle endringer (gjenbruker ActivityLog-tabellen). */
async function audit(
  tx: Prisma.TransactionClient | typeof db,
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  details?: Prisma.InputJsonValue
) {
  await tx.activityLog.create({
    data: { userId, action: `crm.${resource}.${action}`, resource: `crm.${resource}`, resourceId, details },
  });
}

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
};
const int = (f: FormData, k: string) => {
  const v = str(f, k);
  if (v == null) return null;
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : null;
};
const date = (f: FormData, k: string) => {
  const v = str(f, k);
  return v ? new Date(v.length === 10 ? `${v}T09:00:00` : v) : null;
};

function revalidateCrm(companyId?: string) {
  revalidatePath("/dashboard/crm", "layout");
  if (companyId) revalidatePath(`/dashboard/crm/firma/${companyId}`);
}

// ---------- Firma ----------

function companyData(f: FormData) {
  return {
    navn: str(f, "navn") ?? "",
    orgform: str(f, "orgform"),
    bransje: str(f, "bransje"),
    kommune: str(f, "kommune"),
    nettside: str(f, "nettside"),
    generiskEpost: str(f, "generiskEpost"),
    telefon: str(f, "telefon"),
    ansatte: int(f, "ansatte"),
    svakheter: str(f, "svakheter"),
    salgsvinkel: str(f, "salgsvinkel"),
    demoUrl: str(f, "demoUrl"),
    notater: str(f, "notater"),
  };
}

function checkOrgnr(raw: string | null): { orgnr: string | null; error?: string } {
  const orgnr = normalizeOrgnr(raw);
  if (orgnr && !isValidOrgnr(orgnr)) return { orgnr, error: "Ugyldig orgnr (9 siffer med gyldig kontrollsiffer)" };
  return { orgnr };
}

async function duplicateError(orgnr: string, exceptId?: string) {
  const existing = await db.company.findUnique({ where: { orgnr }, select: { id: true, navn: true } });
  if (existing && existing.id !== exceptId) return `Orgnr ${orgnr} finnes allerede (${existing.navn})`;
  return null;
}

export async function createCompany(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const data = companyData(f);
  if (!data.navn) return { ok: false, error: "Navn mangler" };
  const { orgnr, error } = checkOrgnr(str(f, "orgnr"));
  if (error) return { ok: false, error };
  if (orgnr) {
    const dup = await duplicateError(orgnr);
    if (dup) return { ok: false, error: dup };
  }
  const dealTittel = str(f, "dealTittel");
  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      const c = await tx.company.create({ data: { ...data, orgnr } });
      await audit(tx, user.id, "created", "company", c.id, { navn: c.navn, orgnr });
      await tx.crmActivity.create({ data: { companyId: c.id, type: "SYSTEM", tekst: "Firma opprettet", userId: user.id, kilde: "manuell" } });
      if (dealTittel) {
        const d = await tx.deal.create({
          data: {
            companyId: c.id, tittel: dealTittel, stage: "KVALIFISERT",
            sannsynlighet: STAGE_DEFAULT_PROB.KVALIFISERT,
            verdi: int(f, "dealVerdi"), kilde: (str(f, "dealKilde") as DealKilde) ?? "ANNET", eierId: user.id,
            nesteSteg: str(f, "nesteSteg"), nesteStegDato: date(f, "nesteStegDato"),
          },
        });
        await audit(tx, user.id, "created", "deal", d.id, { tittel: d.tittel });
      }
      return c.id;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, error: `Orgnr ${orgnr} finnes allerede` };
    throw e;
  }
  revalidateCrm();
  redirect(`/dashboard/crm/firma/${id}`);
}

export async function updateCompany(id: string, _: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const data = companyData(f);
  if (!data.navn) return { ok: false, error: "Navn mangler" };
  const { orgnr, error } = checkOrgnr(str(f, "orgnr"));
  if (error) return { ok: false, error };
  if (orgnr) {
    const dup = await duplicateError(orgnr, id);
    if (dup) return { ok: false, error: dup };
  }
  try {
    const before = await db.company.findUniqueOrThrow({ where: { id } });
    await db.$transaction(async (tx) => {
      await tx.company.update({ where: { id }, data: { ...data, orgnr } });
      const changed = Object.fromEntries(
        Object.entries({ ...data, orgnr }).filter(([k, v]) => (before as Record<string, unknown>)[k] !== v)
      );
      await audit(tx, user.id, "updated", "company", id, changed as Prisma.InputJsonValue);
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, error: `Orgnr ${orgnr} finnes allerede` };
    throw e;
  }
  revalidateCrm(id);
  return { ok: true, id };
}

// ---------- Kontakt ----------

export async function createContact(companyId: string, _: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const navn = str(f, "navn");
  if (!navn) return { ok: false, error: "Navn mangler" };
  const c = await db.contact.create({
    data: { companyId, navn, rolle: str(f, "rolle"), epost: str(f, "epost"), telefon: str(f, "telefon") },
  });
  await audit(db, user.id, "created", "contact", c.id, { companyId, navn });
  revalidateCrm(companyId);
  return { ok: true, id: c.id };
}

// ---------- Deal ----------

export async function createDeal(companyId: string, _: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const tittel = str(f, "tittel");
  if (!tittel) return { ok: false, error: "Tittel mangler" };
  const stage = (str(f, "stage") ?? "KVALIFISERT") as Stage;
  if (!isStage(stage)) return { ok: false, error: "Ugyldig steg" };
  const nesteStegDato = date(f, "nesteStegDato");
  const err = validateStageChange(stage, { tapsarsak: str(f, "tapsarsak"), nesteStegDato });
  if (err) return { ok: false, error: err };
  const manuell = int(f, "sannsynlighet");
  const positions = (await db.deal.findMany({ where: { stage }, select: { position: true } })).map((d) => d.position);
  const d = await db.deal.create({
    data: {
      companyId, tittel, stage, position: nextPosition(positions),
      sannsynlighet: manuell ?? STAGE_DEFAULT_PROB[stage],
      sannsynlighetKilde: manuell != null ? "manuell" : "stage-default",
      verdi: int(f, "verdi"), oppstartTotal: int(f, "oppstartTotal"), maanedspris: int(f, "maanedspris"),
      pakke: (str(f, "pakke") as Pakke) ?? null, kilde: (str(f, "kilde") as DealKilde) ?? "ANNET",
      eierId: user.id, nesteSteg: str(f, "nesteSteg"), nesteStegDato,
      tapsarsak: str(f, "tapsarsak"), forventetLukkedato: date(f, "forventetLukkedato"),
    },
  });
  await audit(db, user.id, "created", "deal", d.id, { tittel, stage });
  await db.crmActivity.create({ data: { companyId, dealId: d.id, type: "SYSTEM", tekst: `Deal «${tittel}» opprettet i ${STAGE_LABEL[stage]}`, userId: user.id, kilde: "manuell" } });
  revalidateCrm(companyId);
  return { ok: true, id: d.id };
}

export async function updateDealNext(dealId: string, _: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const data = {
    nesteSteg: str(f, "nesteSteg"),
    nesteStegDato: date(f, "nesteStegDato"),
    verdi: int(f, "verdi"),
    maanedspris: int(f, "maanedspris"),
    pakke: (str(f, "pakke") as Pakke) ?? null,
    ...(int(f, "sannsynlighet") != null
      ? { sannsynlighet: Math.min(100, Math.max(0, int(f, "sannsynlighet")!)), sannsynlighetKilde: "manuell" }
      : {}),
  };
  const d = await db.deal.update({ where: { id: dealId }, data });
  await audit(db, user.id, "updated", "deal", dealId, JSON.parse(JSON.stringify(data)));
  revalidateCrm(d.companyId);
  return { ok: true, id: dealId };
}

/** Flytt deal til nytt steg (brukes av dra-og-slipp, tastatur og massehandling). */
export async function moveDeal(
  dealId: string,
  to: string,
  extra: { tapsarsak?: string; nesteStegDato?: string } = {}
): Promise<ActionResult> {
  const user = await requireAdmin();
  if (!isStage(to)) return { ok: false, error: "Ugyldig steg" };
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { ok: false, error: "Fant ikke deal" };
  if (deal.stage === to) return { ok: true, id: dealId };
  const nesteStegDato = extra.nesteStegDato ? new Date(`${extra.nesteStegDato}T09:00:00`) : deal.nesteStegDato;
  const tapsarsak = extra.tapsarsak ?? deal.tapsarsak;
  const err = validateStageChange(to, { tapsarsak, nesteStegDato: to === "PAUSE" ? (extra.nesteStegDato ? nesteStegDato : null) : nesteStegDato });
  if (err) return { ok: false, error: err };
  const positions = (await db.deal.findMany({ where: { stage: to }, select: { position: true } })).map((d) => d.position);
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: dealId },
      data: {
        stage: to,
        position: nextPosition(positions),
        sannsynlighet: probabilityAfterMove(to, deal.sannsynlighet, deal.sannsynlighetKilde),
        tapsarsak: to === "TAPT" ? tapsarsak : deal.tapsarsak,
        nesteStegDato,
        ...(to === "PAUSE" ? { nesteSteg: deal.nesteSteg ?? "Ny vurdering etter pause" } : {}),
        ...(to === "GODKJENT" ? { godkjentAvId: user.id, godkjentDato: now } : {}),
        ...(to === "KONTAKTET" ? { sistKontakt: now } : {}),
        ...(to === "TILBUD" && !deal.tilbudSendtDato ? { tilbudSendtDato: now } : {}),
        ...(to === "VUNNET" ? { signertDato: now } : {}),
      },
    });
    await tx.crmActivity.create({
      data: {
        companyId: deal.companyId, dealId, type: "STEG", userId: user.id, kilde: "manuell",
        tekst: `${STAGE_LABEL[deal.stage]} → ${STAGE_LABEL[to]}${to === "TAPT" ? ` (årsak: ${tapsarsak})` : ""}`,
      },
    });
    await audit(tx, user.id, "moved", "deal", dealId, { from: deal.stage, to });
  });
  revalidateCrm(deal.companyId);
  return { ok: true, id: dealId };
}

export async function bulkMoveDeals(ids: string[], to: string): Promise<{ moved: number; errors: string[] }> {
  const errors: string[] = [];
  let moved = 0;
  for (const id of ids) {
    const r = await moveDeal(id, to);
    if (r.ok) moved++;
    else errors.push(r.error);
  }
  return { moved, errors };
}

// ---------- Aktivitet og oppgaver ----------

export async function addActivity(companyId: string, _: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const tekst = str(f, "tekst");
  if (!tekst) return { ok: false, error: "Tekst mangler" };
  const type = (str(f, "type") ?? "NOTAT") as CrmActivityType;
  const a = await db.crmActivity.create({
    data: { companyId, dealId: str(f, "dealId"), type, tekst, userId: user.id, kilde: "manuell" },
  });
  if (a.dealId && ["EPOST", "TELEFON", "MOTE"].includes(type))
    await db.deal.update({ where: { id: a.dealId }, data: { sistKontakt: new Date() } });
  await audit(db, user.id, "created", "activity", a.id, { companyId, type });
  revalidateCrm(companyId);
  return { ok: true, id: a.id };
}

export async function createTask(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const user = await requireAdmin();
  const tittel = str(f, "tittel");
  const forfall = date(f, "forfall");
  if (!tittel || !forfall) return { ok: false, error: "Tittel og forfallsdato må fylles ut" };
  const t = await db.crmTask.create({
    data: { tittel, forfall, companyId: str(f, "companyId"), dealId: str(f, "dealId"), userId: user.id },
  });
  await audit(db, user.id, "created", "task", t.id, { tittel });
  revalidateCrm(t.companyId ?? undefined);
  return { ok: true, id: t.id };
}

export async function completeTask(id: string, done: boolean): Promise<ActionResult> {
  const user = await requireAdmin();
  const t = await db.crmTask.update({ where: { id }, data: { ferdig: done ? new Date() : null } });
  await audit(db, user.id, done ? "completed" : "reopened", "task", id);
  if (done && t.companyId)
    await db.crmActivity.create({ data: { companyId: t.companyId, dealId: t.dealId, type: "SYSTEM", tekst: `Oppgave fullført: ${t.tittel}`, userId: user.id, kilde: "manuell" } });
  revalidateCrm(t.companyId ?? undefined);
  return { ok: true, id };
}

export async function postponeTask(id: string, days: number): Promise<ActionResult> {
  const user = await requireAdmin();
  const t = await db.crmTask.findUniqueOrThrow({ where: { id } });
  const base = t.forfall < new Date() ? new Date() : t.forfall;
  const forfall = new Date(base.getTime() + days * 86400_000);
  await db.crmTask.update({ where: { id }, data: { forfall } });
  await audit(db, user.id, "postponed", "task", id, { days });
  revalidateCrm(t.companyId ?? undefined);
  return { ok: true, id };
}

/** Marker neste steg på en deal som gjort (fjerner dato, logger aktivitet). */
export async function completeNextStep(dealId: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const d = await db.deal.findUniqueOrThrow({ where: { id: dealId } });
  await db.deal.update({ where: { id: dealId }, data: { nesteSteg: null, nesteStegDato: null } });
  await db.crmActivity.create({ data: { companyId: d.companyId, dealId, type: "SYSTEM", tekst: `Neste steg utført: ${d.nesteSteg ?? "(uten tekst)"}`, userId: user.id, kilde: "manuell" } });
  await audit(db, user.id, "next_step_done", "deal", dealId);
  revalidateCrm(d.companyId);
  return { ok: true, id: dealId };
}

// ---------- Bot-API-nøkler (fase 2) ----------

export async function createApiKey(_: unknown, f: FormData): Promise<{ ok: true; key: string; navn: string } | { ok: false; error: string }> {
  const user = await requireAdmin();
  const { generateApiKey, hashApiKey, SCOPES } = await import("./apikey");
  const navn = str(f, "navn");
  if (!navn || !/^[a-z0-9][a-z0-9 _.-]{1,48}$/i.test(navn)) return { ok: false, error: "Navn: 2–50 tegn (bokstaver, tall, mellomrom, - _ .)" };
  const scopes = SCOPES.filter((s) => f.get(`scope:${s}`) === "on");
  if (!scopes.length) return { ok: false, error: "Velg minst én rettighet" };
  if (await db.botApiKey.findUnique({ where: { navn } })) return { ok: false, error: "Det finnes allerede en nøkkel med dette navnet" };
  const key = generateApiKey();
  const k = await db.botApiKey.create({ data: { navn, scopes, prefix: key.slice(0, 10), hash: hashApiKey(key), createdById: user.id } });
  await audit(db, user.id, "created", "apikey", k.id, { navn, scopes });
  revalidatePath("/dashboard/crm/innstillinger");
  return { ok: true, key, navn };
}

export async function revokeApiKey(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  await db.botApiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  await audit(db, user.id, "revoked", "apikey", id);
  revalidatePath("/dashboard/crm/innstillinger");
  return { ok: true, id };
}

/** Slett firma med kontakter, deals, aktiviteter og oppgaver (kun admin, audit-logges med navn/orgnr). */
export async function deleteCompany(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  const c = await db.company.findUnique({ where: { id }, select: { navn: true, orgnr: true } });
  if (!c) return { ok: false, error: "Fant ikke firma" };
  await db.$transaction(async (tx) => {
    await tx.company.delete({ where: { id } });
    await audit(tx, user.id, "deleted", "company", id, { navn: c.navn, orgnr: c.orgnr });
  });
  revalidateCrm();
  return { ok: true, id };
}

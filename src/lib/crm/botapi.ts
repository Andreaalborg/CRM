// Felles logikk for bot-API (/api/v1) og innkommende leads. Kun server.
import { NextResponse } from "next/server";
import { Prisma, type DealKilde } from "@prisma/client";
import { db } from "@/lib/db";
import { extractApiKey, hashApiKey, hasScope, type Scope } from "./apikey";
import {
  STAGE_DEFAULT_PROB, STAGE_LABEL, isStage, isValidOrgnr, normalizeOrgnr, botMayMoveTo, nextPosition,
  expectedValue, type Stage,
} from "./core";

export type BotKey = { id: string; navn: string; scopes: string[] };

export const RATE_LIMIT_PER_MIN = 120;

export const json = (data: unknown, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });

/** DB-basert rate-limit (fast vindu på 1 minutt) – fungerer på tvers av serverless-instanser. */
export async function rateLimitDb(key: string, limit: number): Promise<{ ok: boolean; remaining: number }> {
  const windowStart = new Date(Math.floor(Date.now() / 60_000) * 60_000);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "ApiRateBucket" ("key", "windowStart", "count") VALUES (${key}, ${windowStart}, 1)
    ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "ApiRateBucket"."count" + 1
    RETURNING "count"`;
  const count = Number(rows[0]?.count ?? 1);
  if (Math.random() < 0.02) await db.apiRateBucket.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 3600_000) } } });
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

/** Autentiser bot-nøkkel + scope + rate-limit. Returnerer nøkkel eller ferdig feilrespons. */
export async function authBot(req: Request, scope: Scope): Promise<BotKey | NextResponse> {
  const raw = extractApiKey(req.headers);
  if (!raw) return json({ error: "Mangler API-nøkkel (Authorization: Bearer …)" }, 401);
  const key = await db.botApiKey.findUnique({ where: { hash: hashApiKey(raw) } });
  if (!key || key.revokedAt) return json({ error: "Ugyldig API-nøkkel" }, 401);
  const rl = await rateLimitDb(`bot:${key.id}`, RATE_LIMIT_PER_MIN);
  if (!rl.ok) return json({ error: "For mange forespørsler" }, 429, { "Retry-After": "60" });
  if (!hasScope(key.scopes, scope)) return json({ error: `Nøkkelen mangler rettigheten ${scope}` }, 403);
  db.botApiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  return { id: key.id, navn: key.navn, scopes: key.scopes };
}

export async function botAudit(bot: string, action: string, resource: string, resourceId: string, details?: Prisma.InputJsonValue) {
  await db.activityLog.create({
    data: { userId: null, action: `crm.${resource}.${action}`, resource: `crm.${resource}`, resourceId, details: { bot, ...(details as object | undefined) } as Prisma.InputJsonValue },
  });
}

// ---------- Feltmapping (Lead Hunter-navn, snake_case) ----------

const s = (v: unknown) => (typeof v === "string" ? v.trim() || null : v == null ? undefined : String(v));
const n = (v: unknown) => (v == null || v === "" ? undefined : Number.isFinite(Number(v)) ? Math.round(Number(v)) : undefined);

function svakheterTekst(v: unknown): string | null | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v))
    return v.map((x) => (typeof x === "string" ? x : [x?.maaling ?? x?.måling ?? x?.tekst, x?.verdi, x?.dato && `(${x.dato})`].filter(Boolean).join(" "))).join("\n") || null;
  return s(v);
}

/** Research-felt boten kan sette på firma. */
export function companyFieldsFrom(b: Record<string, unknown>) {
  const out = {
    navn: s(b.navn),
    orgform: s(b.orgform),
    bransje: s(b.bransje),
    naceKode: s(b.nace_kode ?? b.nace),
    kommune: s(b.kommune),
    nettside: s(b.nettside),
    generiskEpost: s(b.generisk_epost),
    telefon: s(b.telefon),
    ansatte: n(b.ansatte),
    rodtFlagg: s(b.rodt_flagg),
    svakheter: svakheterTekst(b.svakheter),
    salgsvinkel: s(b.salgsvinkel),
    demoUrl: s(b.demo_url),
    notater: s(b.notater),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as Partial<Record<keyof typeof out, string | number | null>>;
}

const KILDE_MAP: Record<string, DealKilde> = { "lead-app": "LEAD_APP", lead_app: "LEAD_APP", leadapp: "LEAD_APP", nettside: "NETTSIDE", "nettside-skjema": "NETTSIDE", chat: "NETTSIDE", henvisning: "HENVISNING" };
export const kildeFra = (v: unknown): DealKilde => KILDE_MAP[String(v ?? "").toLowerCase()] ?? "ANNET";

const STATUS_ALIAS: Record<string, Stage> = { kvalifisert: "KVALIFISERT", innkommende: "INNKOMMENDE", ny: "KVALIFISERT" };
/** Leser status fra body. undefined = ikke oppgitt, null = ukjent verdi. */
export function stageFrom(v: unknown): Stage | null | undefined {
  if (v == null || v === "") return undefined;
  const raw = String(v).trim();
  const up = raw.toUpperCase().replace(/[\s/-]+/g, "_");
  if (isStage(up)) return up;
  const alias = STATUS_ALIAS[raw.toLowerCase()];
  if (alias) return alias;
  const byLabel = (Object.entries(STAGE_LABEL) as [Stage, string][]).find(([, l]) => l.toLowerCase() === raw.toLowerCase());
  return byLabel ? byLabel[0] : null;
}

// ---------- Serialisering ----------

type CompanyWithDeal = Prisma.CompanyGetPayload<{ include: { deals: true } }>;

export function serializeLead(c: CompanyWithDeal) {
  const d = c.deals[0];
  return {
    org_nr: c.orgnr, navn: c.navn, orgform: c.orgform, bransje: c.bransje, kommune: c.kommune, nettside: c.nettside,
    generisk_epost: c.generiskEpost, telefon: c.telefon, ansatte: c.ansatte, rodt_flagg: c.rodtFlagg,
    svakheter: c.svakheter ? c.svakheter.split("\n") : [], salgsvinkel: c.salgsvinkel, demo_url: c.demoUrl, notater: c.notater,
    status: d?.stage ?? null, status_label: d ? STAGE_LABEL[d.stage as Stage] : null,
    sannsynlighet: d?.sannsynlighet ?? null, verdi: d?.verdi ?? null,
    forventet_verdi: d ? expectedValue(d.sannsynlighet, d.verdi) : null,
    neste_steg: d?.nesteSteg ?? null, neste_steg_dato: d?.nesteStegDato ?? null, sist_kontakt: d?.sistKontakt ?? null,
    innvendinger: d?.innvendinger ?? null, tapsarsak: d?.tapsarsak ?? null, kilde: d?.kilde ?? null,
    godkjent_av: d?.godkjentAvId ?? null, godkjent_dato: d?.godkjentDato ?? null,
    crm_id: c.id, oppdatert: c.updatedAt,
  };
}

export const latestDeal = { deals: { orderBy: { updatedAt: "desc" as const }, take: 1 } };

// ---------- Upsert ----------

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Upsert lead på orgnr. Bot kan bare sette Innkommende/Kvalifisert, og aldri røre en deal André har flyttet videre. */
export async function upsertLead(
  b: Record<string, unknown>,
  actor: { bot: string; defaultStage: Stage; kilde?: DealKilde },
  opts: { requireExisting?: boolean; orgnr?: string } = {}
) {
  const orgnr = normalizeOrgnr(String(opts.orgnr ?? b.org_nr ?? b.orgnr ?? ""));
  if (!orgnr || !isValidOrgnr(orgnr)) throw new ApiError(400, "Ugyldig eller manglende org_nr (9 siffer med gyldig kontrollsiffer)");
  const wanted = stageFrom(b.status ?? b.stage);
  if (wanted === null) throw new ApiError(400, "Ukjent status");
  if (wanted && !botMayMoveTo(null, wanted)) throw new ApiError(403, `Bot kan ikke sette status «${STAGE_LABEL[wanted]}». Bare André kan godkjenne for kontakt og flytte videre.`);
  if ("godkjent_av" in b || "godkjent_dato" in b) throw new ApiError(403, "Bot kan ikke sette godkjenning");

  const fields = companyFieldsFrom(b);
  const sannsynlighet = n(b.sannsynlighet);
  const verdi = n(b.verdi ?? b.forventet_kv24 ?? b.kv24);

  const existing = await db.company.findUnique({ where: { orgnr }, include: latestDeal });
  if (!existing && opts.requireExisting) throw new ApiError(404, "Fant ikke lead med dette org_nr");

  if (existing) {
    const deal = existing.deals[0];
    if (wanted && deal && deal.stage !== wanted && !botMayMoveTo(deal.stage as Stage, wanted))
      throw new ApiError(403, `Leadet står i «${STAGE_LABEL[deal.stage as Stage]}». Bot kan ikke endre status etter at André har godkjent eller flyttet det.`);
    const changed: Record<string, unknown> = {};
    await db.$transaction(async (tx) => {
      const { navn, ...rest } = fields;
      await tx.company.update({ where: { id: existing.id }, data: { ...rest, ...(navn ? { navn: String(navn) } : {}) } as Prisma.CompanyUpdateInput });
      Object.assign(changed, fields);
      if (deal) {
        const data: Prisma.DealUpdateInput = {};
        if (sannsynlighet != null && deal.sannsynlighetKilde !== "manuell") Object.assign(data, { sannsynlighet: Math.min(100, Math.max(0, sannsynlighet)), sannsynlighetKilde: "leadhunter" });
        if (verdi != null) data.verdi = verdi;
        if (b.innvendinger != null) data.innvendinger = s(b.innvendinger);
        if (wanted && deal.stage !== wanted) data.stage = wanted;
        if (Object.keys(data).length) { await tx.deal.update({ where: { id: deal.id }, data }); Object.assign(changed, data); }
      } else {
        await createDealTx(tx, existing.id, existing.navn, wanted ?? actor.defaultStage, { sannsynlighet, verdi, kilde: actor.kilde ?? kildeFra(b.kilde), bot: actor.bot });
      }
      if (b.notat || Object.keys(changed).length)
        await tx.crmActivity.create({ data: { companyId: existing.id, dealId: deal?.id, type: "SYSTEM", tekst: `Oppdatert av ${actor.bot}: ${Object.keys(changed).join(", ") || "ingen felt"}`, kilde: actor.bot } });
    });
    await botAudit(actor.bot, "upsert_existing", "company", existing.id, { orgnr, changed: JSON.parse(JSON.stringify(changed)) });
    const fresh = await db.company.findUniqueOrThrow({ where: { id: existing.id }, include: latestDeal });
    return { created: false, duplicate: true, lead: serializeLead(fresh) };
  }

  if (!fields.navn) throw new ApiError(400, "navn mangler");
  let id: string;
  try {
    id = await db.$transaction(async (tx) => {
      const c = await tx.company.create({ data: { ...(fields as Prisma.CompanyCreateInput), navn: String(fields.navn), orgnr } });
      await tx.crmActivity.create({ data: { companyId: c.id, type: "SYSTEM", tekst: `Opprettet av ${actor.bot}`, kilde: actor.bot } });
      await createDealTx(tx, c.id, c.navn, wanted ?? actor.defaultStage, { sannsynlighet, verdi, kilde: actor.kilde ?? kildeFra(b.kilde), bot: actor.bot });
      return c.id;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return upsertLead(b, actor, opts); // samtidig opprettelse – prøv som oppdatering
    throw e;
  }
  await botAudit(actor.bot, "created", "company", id, { orgnr });
  const fresh = await db.company.findUniqueOrThrow({ where: { id }, include: latestDeal });
  return { created: true, duplicate: false, lead: serializeLead(fresh) };
}

export async function createDealTx(
  tx: Prisma.TransactionClient, companyId: string, navn: string, stage: Stage,
  o: { sannsynlighet?: number; verdi?: number; kilde: DealKilde; bot: string; nesteSteg?: string; nesteStegDato?: Date; tittel?: string }
) {
  const positions = (await tx.deal.findMany({ where: { stage }, select: { position: true } })).map((d) => d.position);
  const d = await tx.deal.create({
    data: {
      companyId, tittel: o.tittel ?? `Ny kunde: ${navn}`, stage, position: nextPosition(positions),
      sannsynlighet: o.sannsynlighet != null ? Math.min(100, Math.max(0, o.sannsynlighet)) : STAGE_DEFAULT_PROB[stage],
      sannsynlighetKilde: o.sannsynlighet != null ? "leadhunter" : "stage-default",
      verdi: o.verdi ?? null, kilde: o.kilde,
      nesteSteg: o.nesteSteg ?? (stage === "KVALIFISERT" ? "Vurder og godkjenn for kontakt" : "Svar på henvendelsen"),
      nesteStegDato: o.nesteStegDato ?? new Date(),
    },
  });
  await tx.crmActivity.create({ data: { companyId, dealId: d.id, type: "STEG", tekst: `Lagt i ${STAGE_LABEL[stage]} av ${o.bot}`, kilde: o.bot } });
  return d;
}

export async function readJson(req: Request): Promise<Record<string, unknown> | NextResponse> {
  try {
    const b = await req.json();
    if (!b || typeof b !== "object" || Array.isArray(b)) return json({ error: "Body må være et JSON-objekt" }, 400);
    return b as Record<string, unknown>;
  } catch {
    return json({ error: "Ugyldig JSON" }, 400);
  }
}

export function handleError(e: unknown) {
  if (e instanceof ApiError) return json({ error: e.message }, e.status);
  console.error("[api/v1]", e);
  return json({ error: "Serverfeil" }, 500);
}

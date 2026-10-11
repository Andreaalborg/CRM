"use server";
// Fase 3 – Andrés handlinger på utkast. sendDraft er den eneste veien til mailer.deliver (ett klikk = én e-post).
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deliver, emailHealth } from "./mailer";
import { isSuppressed, newContactsLast7d, unsubscribeByToken } from "./outreach";
import { recipientBlockers, unresolved, footer, suppressionHash, STEG_LABEL, SEQ_ACTIVE_STAGES } from "./outreach-core";

type R = { ok: true; dryRun?: boolean } | { ok: false; error: string };

async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s || s.user.role !== "SUPER_ADMIN") throw new Error("Ikke autorisert");
  return s.user;
}
const base = () => (process.env.CRM_PUBLIC_URL || "https://crm.intellisenseai.no").replace(/\/$/, "");
export async function unsubUrls(token: string) {
  return { page: `${base()}/avmeld/${token}`, post: `${base()}/api/avmeld/${token}` };
}
function kildeTekst(kilde: string) {
  return kilde === "LEAD_APP" || kilde === "ANNET" ? "virksomheten i Enhetsregisteret (Brønnøysund) og på deres egen nettside" : "virksomheten på deres egen nettside";
}
const done = () => revalidatePath("/dashboard/crm", "layout");

export async function saveDraft(id: string, _: unknown, f: FormData): Promise<R> {
  const user = await requireAdmin();
  const emne = String(f.get("emne") || "").trim(), tekst = String(f.get("tekst") || "").trim();
  if (!emne || !tekst) return { ok: false, error: "Emne og tekst må fylles ut" };
  const r = await db.outreachDraft.updateMany({ where: { id, status: "UTKAST" }, data: { emne, tekst } });
  if (!r.count) return { ok: false, error: "Utkastet finnes ikke eller er ikke lenger et utkast" };
  await db.activityLog.create({ data: { userId: user.id, action: "crm.outreach.edited", resource: "crm.outreach", resourceId: id } });
  done();
  return { ok: true };
}

export async function skipDraft(id: string): Promise<R> {
  const user = await requireAdmin();
  const r = await db.outreachDraft.updateMany({ where: { id, status: "UTKAST" }, data: { status: "HOPPET_OVER", godkjentAvId: user.id, godkjentDato: new Date() } });
  if (!r.count) return { ok: false, error: "Utkastet er ikke lenger åpent" };
  await db.activityLog.create({ data: { userId: user.id, action: "crm.outreach.skipped", resource: "crm.outreach", resourceId: id } });
  done();
  return { ok: true };
}

/** Kontrollerer alt som må være på plass før sending. Brukes både i UI og i sendDraft. */
export async function draftBlockers(id: string): Promise<string[]> {
  const d = await db.outreachDraft.findUnique({ where: { id }, include: { company: true, deal: true } });
  if (!d) return ["Fant ikke utkastet"];
  const r = recipientBlockers({
    epost: d.til, orgform: d.company.orgform, suppressed: await isSuppressed(d.til, d.company.orgnr),
    steg: d.steg, newContactsLast7d: await newContactsLast7d(),
  });
  const u = unresolved(d.emne + "\n" + d.tekst);
  if (u.length) r.push(`Flettefelt uten verdi: ${u.map((x) => `{${x}}`).join(", ")} – fyll inn i firmaet eller rediger teksten`);
  if (/\[UTKAST-MAL\]/.test(d.emne + d.tekst)) r.push("Teksten bruker fortsatt plassholdermalen ([UTKAST-MAL]) – rediger og fjern merket før sending");
  if (!(SEQ_ACTIVE_STAGES as readonly string[]).includes(d.deal.stage)) r.push(`Dealen står i ${d.deal.stage} – sekvensen er stoppet`);
  return r;
}

export async function sendDraft(id: string): Promise<R> {
  const user = await requireAdmin();
  const health = await emailHealth();
  if (!health.ok && !health.dryRun) return { ok: false, error: `Sending er slått av: ${health.reasons.join("; ")}` };
  const blockers = await draftBlockers(id);
  if (blockers.length) return { ok: false, error: blockers.join(" · ") };
  // Lås utkastet (hindrer dobbeltsending ved dobbeltklikk)
  const lock = await db.outreachDraft.updateMany({ where: { id, status: "UTKAST" }, data: { status: "SENDT", godkjentAvId: user.id, godkjentDato: new Date() } });
  if (!lock.count) return { ok: false, error: "Utkastet er allerede sendt eller lukket" };
  const d = (await db.outreachDraft.findUnique({ where: { id }, include: { deal: true } }))!;
  const u = await unsubUrls(d.token);
  const text = `${d.tekst}\n\n${footer(u.page, kildeTekst(d.deal.kilde))}`;
  try {
    const res = await deliver({ to: d.til, subject: d.emne, text, unsubUrl: u.page, unsubPost: u.post });
    const now = new Date();
    await db.$transaction(async (tx) => {
      await tx.outreachDraft.update({ where: { id }, data: { sendtDato: now, providerId: res.id, dryRun: res.dryRun, feil: null } });
      if (d.steg === 0 && d.deal.stage === "GODKJENT") await tx.deal.update({ where: { id: d.dealId }, data: { stage: "KONTAKTET", sistKontakt: now } });
      else await tx.deal.update({ where: { id: d.dealId }, data: { sistKontakt: now } });
      await tx.crmActivity.create({ data: { companyId: d.companyId, dealId: d.dealId, type: "EPOST", userId: user.id, kilde: "fase3", tekst: `${STEG_LABEL[d.steg]}-e-post ${res.dryRun ? "(TESTMODUS – ikke sendt)" : "sendt"} til ${d.til}: «${d.emne}». Godkjent og sendt av ${user.email ?? user.id}.` } });
      await tx.activityLog.create({ data: { userId: user.id, action: "crm.outreach.sent", resource: "crm.outreach", resourceId: id, details: { til: d.til, steg: d.steg, providerId: res.id, dryRun: res.dryRun } } });
    });
    done();
    return { ok: true, dryRun: res.dryRun };
  } catch (e) {
    await db.outreachDraft.update({ where: { id }, data: { status: "FEILET", feil: (e as Error).message.slice(0, 500) } });
    done();
    return { ok: false, error: `Sending feilet: ${(e as Error).message}` };
  }
}

/** Svar mottatt → Svart (stopper sekvensen). */
export async function markReplied(dealId: string): Promise<R> {
  const user = await requireAdmin();
  const deal = await db.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { ok: false, error: "Fant ikke deal" };
  await db.$transaction([
    db.deal.update({ where: { id: dealId }, data: { stage: "SVART", sistKontakt: new Date() } }),
    db.outreachDraft.updateMany({ where: { dealId, status: "UTKAST" }, data: { status: "STOPPET", stoppGrunn: "Svar mottatt" } }),
    db.crmActivity.create({ data: { companyId: deal.companyId, dealId, type: "EPOST", userId: user.id, kilde: "manuell", tekst: "Svar mottatt – sekvensen stoppet" } }),
  ]);
  done();
  return { ok: true };
}

/** Nei takk → Tapt + sperreliste for alltid. */
export async function markNo(dealId: string): Promise<R> {
  const user = await requireAdmin();
  const deal = await db.deal.findUnique({ where: { id: dealId }, include: { company: true } });
  if (!deal) return { ok: false, error: "Fant ikke deal" };
  const c = deal.company;
  const entries = [c.generiskEpost && { hash: suppressionHash("epost", c.generiskEpost), type: "epost" }, c.orgnr && { hash: suppressionHash("orgnr", c.orgnr), type: "orgnr" }].filter(Boolean) as { hash: string; type: string }[];
  await db.$transaction(async (tx) => {
    for (const e of entries) await tx.suppression.upsert({ where: { hash: e.hash }, create: { ...e, grunn: "nei" }, update: {} });
    await tx.deal.update({ where: { id: dealId }, data: { stage: "TAPT", tapsarsak: "Sa nei (sperret)" } });
    await tx.outreachDraft.updateMany({ where: { dealId, status: "UTKAST" }, data: { status: "STOPPET", stoppGrunn: "Sa nei" } });
    await tx.crmActivity.create({ data: { companyId: c.id, dealId, type: "SYSTEM", userId: user.id, kilde: "manuell", tekst: "Sa nei – lagt på sperrelisten for alltid" } });
  });
  done();
  return { ok: true };
}

/** Offentlig avmelding (ingen innlogging). */
export async function unsubscribeAction(token: string): Promise<{ ok: boolean }> {
  const r = await unsubscribeByToken(token);
  return { ok: r.ok };
}

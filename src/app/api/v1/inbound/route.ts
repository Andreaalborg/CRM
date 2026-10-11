// POST /api/v1/inbound – innkommende henvendelser fra intellisenseai.no (/kontakt, «Be om tilbud», chat).
// Autentisering: HMAC-signatur (X-IS-Timestamp + X-IS-Signature) eller X-IS-Key, med INBOUND_WEBHOOK_SECRET.
// Leadet havner i «Innkommende» med neste steg i dag, slik at det vises på «I dag». Sender ingen e-post.
import { db } from "@/lib/db";
import { verifyInbound } from "@/lib/crm/apikey";
import { normalizeOrgnr, isValidOrgnr, isGenericEmail, STAGE_LABEL, type Stage } from "@/lib/crm/core";
import { json, rateLimitDb, botAudit, createDealTx } from "@/lib/crm/botapi";

export const dynamic = "force-dynamic";

const KILDER: Record<string, string> = { kontakt: "Kontaktskjema", tilbud: "Be om tilbud", chat: "Chat", ghl: "Kontaktskjema (GHL)" };
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);

export async function POST(req: Request) {
  const body = await req.text();
  if (body.length > 20_000) return json({ error: "For stor forespørsel" }, 413);
  const v = verifyInbound(process.env.INBOUND_WEBHOOK_SECRET, req.headers, body);
  if (!v.ok) return json({ error: v.reason }, 401);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukjent";
  if (!(await rateLimitDb(`inbound:${ip}`, 30)).ok) return json({ error: "For mange forespørsler" }, 429);

  let b: Record<string, unknown>;
  try { b = JSON.parse(body); } catch { return json({ error: "Ugyldig JSON" }, 400); }
  // GHL-webhooks sender gjerne full_name/email/phone/company_name
  const navn = str(b.navn ?? b.name ?? b.full_name, 200);
  const epost = str(b.epost ?? b.email, 200)?.toLowerCase() ?? null;
  const telefon = str(b.telefon ?? b.phone, 50);
  const firma = str(b.firma ?? b.company ?? b.company_name, 200);
  const melding = str(b.melding ?? b.message ?? b.behov, 5000);
  const kildeKey = String(b.kilde ?? b.source ?? "kontakt").toLowerCase();
  const kilde = KILDER[kildeKey] ?? `Nettside (${kildeKey.slice(0, 40)})`;
  const side = str(b.side ?? b.page, 300);
  const orgnrRaw = normalizeOrgnr(str(b.orgnr ?? b.org_nr, 20));
  const orgnr = orgnrRaw && isValidOrgnr(orgnrRaw) ? orgnrRaw : null;
  if (!navn && !epost && !telefon) return json({ error: "Mangler navn, e-post eller telefon" }, 400);
  if (epost && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost)) return json({ error: "Ugyldig e-post" }, 400);

  // Dedup: orgnr → kontakt med samme e-post → firma med samme generiske e-post
  let company =
    (orgnr && (await db.company.findUnique({ where: { orgnr } }))) ||
    (epost && (await db.contact.findFirst({ where: { epost }, include: { company: true } }))?.company) ||
    (epost && (await db.company.findFirst({ where: { generiskEpost: epost } }))) ||
    null;
  const duplicate = !!company;

  const tekst = [`Henvendelse via ${kilde}${side ? ` (${side})` : ""}`, navn && `Navn: ${navn}`, epost && `E-post: ${epost}`, telefon && `Telefon: ${telefon}`, firma && `Firma: ${firma}`, melding && `\n${melding}`]
    .filter(Boolean).join("\n");

  const result = await db.$transaction(async (tx) => {
    if (!company) {
      company = await tx.company.create({
        data: {
          navn: firma || navn || epost || "Ukjent henvendelse", orgnr,
          generiskEpost: epost && isGenericEmail(epost) ? epost : null, telefon: firma ? null : telefon,
        },
      });
    }
    if (navn || epost || telefon) {
      const exists = epost ? await tx.contact.findFirst({ where: { companyId: company.id, epost } }) : null;
      if (!exists) await tx.contact.create({ data: { companyId: company.id, navn: navn || epost || "Ukjent", epost, telefon, rolle: "Kontaktperson (nettside)" } });
    }
    const open = await tx.deal.findFirst({ where: { companyId: company.id, stage: { notIn: ["VUNNET", "TAPT"] } }, orderBy: { updatedAt: "desc" } });
    let dealId: string;
    if (open) {
      dealId = open.id;
      // Ikke flytt en deal André jobber med – bare sett neste steg i dag
      await tx.deal.update({ where: { id: open.id }, data: { nesteSteg: `Ny henvendelse (${kilde}) – svar`, nesteStegDato: new Date() } });
    } else {
      const d = await createDealTx(tx, company.id, company.navn, "INNKOMMENDE", { kilde: "NETTSIDE", bot: "nettside", tittel: `${kilde}: ${firma || navn || epost}`, nesteSteg: `Svar på henvendelsen (${kilde})`, nesteStegDato: new Date() });
      dealId = d.id;
    }
    await tx.crmActivity.create({ data: { companyId: company.id, dealId, type: "EPOST", tekst, kilde: `nettside/${kildeKey}` } });
    const stage = (await tx.deal.findUniqueOrThrow({ where: { id: dealId } })).stage as Stage;
    return { companyId: company.id, dealId, stage };
  });
  await botAudit("nettside", duplicate ? "inbound_existing" : "inbound_created", "company", result.companyId, { kilde: kildeKey, auth: v.method });
  return json({ ok: true, created: !duplicate, duplicate, crm_id: result.companyId, status: STAGE_LABEL[result.stage] }, duplicate ? 200 : 201);
}

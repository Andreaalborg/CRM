// POST /api/v1/leads/{orgnr}/aktivitet  { type, tekst, kilde }
import { db } from "@/lib/db";
import { normalizeOrgnr } from "@/lib/crm/core";
import { authBot, json, readJson, botAudit } from "@/lib/crm/botapi";

export const dynamic = "force-dynamic";
const TYPES = ["NOTAT", "EPOST", "TELEFON", "MOTE", "SYSTEM"] as const;

export async function POST(req: Request, { params }: { params: Promise<{ orgnr: string }> }) {
  const bot = await authBot(req, "activities:write");
  if (bot instanceof Response) return bot;
  const b = await readJson(req);
  if (b instanceof Response) return b;
  const orgnr = normalizeOrgnr((await params).orgnr);
  const c = orgnr ? await db.company.findUnique({ where: { orgnr }, include: { deals: { orderBy: { updatedAt: "desc" }, take: 1 } } }) : null;
  if (!c) return json({ error: "Fant ikke lead" }, 404);
  const tekst = typeof b.tekst === "string" ? b.tekst.trim().slice(0, 5000) : "";
  if (!tekst) return json({ error: "tekst mangler" }, 400);
  const t = String(b.type ?? "NOTAT").toUpperCase();
  const type = (TYPES as readonly string[]).includes(t) ? (t as (typeof TYPES)[number]) : "NOTAT";
  const kilde = `${bot.navn}${typeof b.kilde === "string" && b.kilde.trim() ? ` / ${b.kilde.trim().slice(0, 100)}` : ""}`;
  const a = await db.crmActivity.create({ data: { companyId: c.id, dealId: c.deals[0]?.id, type, tekst, kilde } });
  await botAudit(bot.navn, "created", "activity", a.id, { orgnr, type });
  return json({ ok: true, id: a.id }, 201);
}

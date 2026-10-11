// GET /api/v1/leads/{orgnr} · PATCH /api/v1/leads/{orgnr} (research-felt og notater)
import { db } from "@/lib/db";
import { normalizeOrgnr } from "@/lib/crm/core";
import { authBot, json, latestDeal, serializeLead, upsertLead, readJson, handleError } from "@/lib/crm/botapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ orgnr: string }> }) {
  const bot = await authBot(req, "leads:read");
  if (bot instanceof Response) return bot;
  const orgnr = normalizeOrgnr((await params).orgnr);
  const c = orgnr ? await db.company.findUnique({ where: { orgnr }, include: latestDeal }) : null;
  if (!c) return json({ error: "Fant ikke lead" }, 404);
  return json({ lead: serializeLead(c) });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ orgnr: string }> }) {
  const bot = await authBot(req, "leads:write");
  if (bot instanceof Response) return bot;
  const b = await readJson(req);
  if (b instanceof Response) return b;
  try {
    const r = await upsertLead(b, { bot: bot.navn, defaultStage: "KVALIFISERT" }, { requireExisting: true, orgnr: (await params).orgnr });
    return json(r);
  } catch (e) {
    return handleError(e);
  }
}

// Bot-API: GET /api/v1/leads?status=&min_sannsynlighet=&limit=  ·  POST /api/v1/leads (upsert på org_nr)
// Ingen endepunkt i /api/v1 sender e-post.
import { db } from "@/lib/db";
import { authBot, json, latestDeal, serializeLead, upsertLead, readJson, handleError, stageFrom } from "@/lib/crm/botapi";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const bot = await authBot(req, "leads:read");
  if (bot instanceof Response) return bot;
  const u = new URL(req.url);
  const status = stageFrom(u.searchParams.get("status"));
  if (status === null) return json({ error: "Ukjent status" }, 400);
  const min = Number(u.searchParams.get("min_sannsynlighet") ?? "") || 0;
  const limit = Math.min(500, Math.max(1, Number(u.searchParams.get("limit") ?? 100) || 100));
  const companies = await db.company.findMany({
    where: { orgnr: { not: null }, ...(status || min ? { deals: { some: { ...(status ? { stage: status } : {}), ...(min ? { sannsynlighet: { gte: min } } : {}) } } } : {}) },
    include: latestDeal, orderBy: { updatedAt: "desc" }, take: limit,
  });
  return json({ leads: companies.map(serializeLead) });
}

export async function POST(req: Request) {
  const bot = await authBot(req, "leads:write");
  if (bot instanceof Response) return bot;
  const b = await readJson(req);
  if (b instanceof Response) return b;
  try {
    const r = await upsertLead(b, { bot: bot.navn, defaultStage: "KVALIFISERT" });
    return json(r, r.created ? 201 : 200);
  } catch (e) {
    return handleError(e);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/portal/session";
import { submissionWhere, matchesQuery, toCsv, portalStatus, PORTAL_STATUS } from "@/lib/portal/core";

// CSV med nøyaktig samme filter som listen (samme funksjoner), kun egen organisasjon.
export async function GET(req: NextRequest) {
  let c;
  try { c = await requireCustomer({ redirectTo: false }); } catch { return new Response("Ikke autorisert", { status: 401 }); }
  const sp = req.nextUrl.searchParams;
  const f = { q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, formId: sp.get("form") ?? undefined, fra: sp.get("fra") ?? undefined, til: sp.get("til") ?? undefined };
  const rows = (await db.submission.findMany({ where: submissionWhere(c.orgId, f), orderBy: { createdAt: "desc" }, take: 500, select: { createdAt: true, data: true, notes: true, handledAt: true, contactedAt: true, form: { select: { name: true } } } }))
    .filter((r) => matchesQuery(r.data, f.q));
  const csv = toCsv(rows.map((r) => ({ createdAt: r.createdAt, form: r.form.name, status: PORTAL_STATUS[portalStatus(r)], data: r.data, notes: r.notes })));
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="henvendelser-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
}

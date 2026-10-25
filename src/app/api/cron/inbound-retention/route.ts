import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { inboundRetention } from "@/lib/crm/inbound-retention";

// 12 måneders lagringstid for innkommende henvendelser. TØRRKJØRING som standard (sletter ingenting).
// Sletting krever BÅDE env INBOUND_RETENTION_APPLY=1 OG ?apply=1. Ingen e-post. Ikke lagt i vercel.json (kjøres manuelt til André har sagt ja).
export const dynamic = "force-dynamic";

async function run(request: NextRequest) {
  const denied = requireCronAuth(request);
  if (denied) return denied;
  const apply = process.env.INBOUND_RETENTION_APPLY === "1" && request.nextUrl.searchParams.get("apply") === "1";
  const r = await inboundRetention(new Date(), apply);
  console.log("[cron/inbound-retention]", JSON.stringify({ dryRun: r.dryRun, candidates: r.candidates, deleted: r.deleted }));
  return NextResponse.json({ ok: true, ...r });
}
export const GET = run;
export const POST = run;

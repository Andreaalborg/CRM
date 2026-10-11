import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { planOutreach, gdprSweep } from "@/lib/crm/outreach";

// Fase 3-cron: lager KUN utkast (dag 0/4/10), stopper/pauser sekvenser og kjører GDPR-opprydding.
// Sender ALDRI e-post (importerer ikke mailer/Resend). Kalles av GitHub Actions hvert 30. min + daglig Vercel-cron som reserve.
export const dynamic = "force-dynamic";

async function run(request: NextRequest) {
  const denied = requireCronAuth(request); // fail closed
  if (denied) return denied;
  const now = new Date();
  const plan = await planOutreach(now);
  const gdpr = await gdprSweep(now);
  console.log("[cron/fase3]", JSON.stringify({ plan, gdpr: { deleted: gdpr.deleted } }));
  return NextResponse.json({ ok: true, at: now.toISOString(), plan, gdpr: { deleted: gdpr.deleted } });
}
export const GET = run;
export const POST = run;

// Fase 3 – den ENESTE kodeveien som kan sende en oppfølgings-e-post. Importeres kun av outreach-actions.ts (André-klikk).
// Sikkerhet: OUTREACH_DRY_RUN=1 eller NODE_ENV=test → Resend kalles aldri. Helsesjekken stopper sending til domenet er verifisert.
import { healthFromParts } from "./outreach-core";

export const isDryRun = () => process.env.OUTREACH_DRY_RUN === "1" || process.env.NODE_ENV === "test";

let cache: { at: number; status: string | null } | null = null;
async function domainStatus(): Promise<string | null> {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache.status;
  let status: string | null = null;
  try {
    // Kun lesing (GET /domains) – sender ingenting.
    const r = await fetch("https://api.resend.com/domains", { headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}` }, signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const j = (await r.json()) as { data?: { name: string; status: string }[] };
      status = j.data?.find((d) => d.name === "intellisenseai.no")?.status ?? null;
    } else status = `api-feil ${r.status}`;
  } catch { status = "utilgjengelig"; }
  cache = { at: Date.now(), status };
  return status;
}

export async function emailHealth(): Promise<{ ok: boolean; reasons: string[]; dryRun: boolean }> {
  const apiKey = !!process.env.RESEND_API_KEY && !/dummy/.test(process.env.RESEND_API_KEY);
  const h = healthFromParts({ emailFrom: process.env.EMAIL_FROM, apiKey, domainStatus: apiKey ? await domainStatus() : null });
  return { ...h, dryRun: isDryRun() };
}

export async function deliver(m: { to: string; subject: string; text: string; unsubUrl: string; unsubPost: string }): Promise<{ id: string; dryRun: boolean }> {
  if (isDryRun()) return { id: `dryrun-${Date.now()}`, dryRun: true };
  const h = await emailHealth();
  if (!h.ok) throw new Error(`Sending sperret: ${h.reasons.join("; ")}`);
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM, to: [m.to], subject: m.subject, text: m.text, reply_to: process.env.EMAIL_REPLY_TO || undefined,
      headers: { "List-Unsubscribe": `<${m.unsubPost}>, <${m.unsubUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
    signal: AbortSignal.timeout(15000),
  });
  const j = (await r.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!r.ok || !j.id) throw new Error(j.message || `Resend svarte ${r.status}`);
  return { id: j.id, dryRun: false };
}

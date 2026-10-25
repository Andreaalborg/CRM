// Varsel til EIER ved ny innkommende henvendelse. AV uten INBOUND_NOTIFY_ENABLED=1.
// Mottaker låses via email-guard (kun eierens adresser) – aldri innsender. Feil svelges (lagring avbrytes aldri).
import { ownerAllowed } from "@/lib/email-guard";
import { db } from "@/lib/db";
import { appBaseUrl } from "@/lib/base-url";
import { isDryRun, emailHealth } from "./mailer";

export const NOTIFY_REPLY_TO = "andreaalborg@intellisenseai.no";

export function notifyEnabled() { return process.env.INBOUND_NOTIFY_ENABLED === "1"; }

/** Mottakere: OWNER_NOTIFY_EMAILS (ellers standardadressen), filtrert gjennom eier-vakten. */
export async function notifyRecipients(): Promise<string[]> {
  // Autoritet = standardadressen + SUPER_ADMIN i DB (ikke env): OWNER_NOTIFY_EMAILS kan bare velge ut blant disse, aldri legge til nye.
  const admins = (await db.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { email: true } })).map((u) => u.email ?? "");
  const owners = [NOTIFY_REPLY_TO, ...admins].filter(Boolean);
  const wanted = (process.env.OWNER_NOTIFY_EMAILS || NOTIFY_REPLY_TO).split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [...new Set(wanted)].filter((e) => ownerAllowed(e, owners));
}

export function buildNotify(p: { kilde: string; navn: string | null; side: string | null; utdrag: string | null; dealId: string; duplicate: boolean }) {
  const base = appBaseUrl();
  const utdrag = (p.utdrag || "").replace(/\s+/g, " ").slice(0, 200);
  return {
    subject: `Ny henvendelse: ${p.kilde}${p.navn ? ` – ${p.navn}` : ""}`.slice(0, 150),
    text: [
      `Ny henvendelse i CRM (${p.kilde}${p.duplicate ? ", kjent kunde" : ""}).`,
      p.navn ? `Fra: ${p.navn}` : "", p.side ? `Side/emne: ${p.side}` : "", utdrag ? `Utdrag: ${utdrag}` : "",
      "", `Åpne: ${base}/dashboard/crm`, "", "Intern varsling. Svar sendes manuelt fra din egen e-post.",
    ].filter((x, k, a) => x !== "" || (a[k - 1] !== "" && k > 0)).join("\n"),
  };
}

export async function notifyOwnerNewInbound(p: Parameters<typeof buildNotify>[0]): Promise<{ sent: boolean; reason?: string }> {
  try {
    if (!notifyEnabled()) return { sent: false, reason: "flagg av" };
    const to = await notifyRecipients();
    if (!to.length) return { sent: false, reason: "ingen eier-mottaker" };
    const m = buildNotify(p);
    if (isDryRun()) { console.log("[inbound-notify] dry-run", to.length); return { sent: false, reason: "dry-run" }; }
    const h = await emailHealth();
    if (!h.ok) { console.warn("[inbound-notify] sending sperret:", h.reasons.join("; ")); return { sent: false, reason: "helsesjekk" }; }
    const { sendEmail } = await import("@/lib/email");
    const r = await sendEmail({ to, subject: m.subject, text: m.text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${m.text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre>`, replyTo: NOTIFY_REPLY_TO });
    return { sent: r.success, reason: r.error };
  } catch (e) {
    console.error("[inbound-notify] feilet", e instanceof Error ? e.message : e);
    return { sent: false, reason: "feil" };
  }
}

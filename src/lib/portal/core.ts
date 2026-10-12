// Fase 4 – ren logikk for kundeportalen (testes i src/lib/crm/portal.test.ts).
import { createHash, randomBytes } from "node:crypto";

export const LINK_TTL_SELF_MIN = 15; // lenke kunden ber om selv
export const LINK_TTL_ADMIN_H = 24; // engangslenke admin lager i CRM

export function newLoginToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashLoginToken(token) };
}
export function hashLoginToken(token: string): string {
  return createHash("sha256").update(`login:${token}`).digest("hex");
}
export function tokenUsable(t: { expiresAt: Date; usedAt: Date | null } | null, now = new Date()): boolean {
  return !!t && !t.usedAt && t.expiresAt.getTime() > now.getTime();
}

export type PortalFilter = { q?: string; status?: string; formId?: string; fra?: string; til?: string };
export const PORTAL_STATUS = { ny: "Ny", kontaktet: "Kontaktet", handtert: "Håndtert" } as const;
export type PortalStatusKey = keyof typeof PORTAL_STATUS;
/** Visningsstatus: Håndtert vinner over Kontaktet, som vinner over Ny. */
export function portalStatus(s: { handledAt: Date | null; contactedAt?: Date | null }): PortalStatusKey {
  if (s.handledAt) return "handtert";
  if (s.contactedAt) return "kontaktet";
  return "ny";
}

/** Prisma-where for innsendinger. organizationId er ALLTID med – kunden ser aldri andres data. */
export function submissionWhere(orgId: string, f: PortalFilter = {}) {
  if (!orgId) throw new Error("organizationId mangler");
  const where: Record<string, unknown> = { organizationId: orgId, status: { not: "SPAM" } };
  if (f.status === "ny") { where.handledAt = null; where.contactedAt = null; }
  if (f.status === "kontaktet") { where.handledAt = null; where.contactedAt = { not: null }; }
  if (f.status === "handtert") where.handledAt = { not: null };
  if (f.formId) where.formId = f.formId;
  const created: Record<string, Date> = {};
  if (f.fra && /^\d{4}-\d{2}-\d{2}$/.test(f.fra)) created.gte = new Date(`${f.fra}T00:00:00`);
  if (f.til && /^\d{4}-\d{2}-\d{2}$/.test(f.til)) created.lte = new Date(`${f.til}T23:59:59`);
  if (Object.keys(created).length) where.createdAt = created;
  return where;
}
/** Fritekstsøk i JSON-data (gjøres i minnet etter org-filtrering). */
export function matchesQuery(data: unknown, q?: string): boolean {
  if (!q?.trim()) return true;
  return JSON.stringify(data ?? {}).toLowerCase().includes(q.trim().toLowerCase());
}

const LABELS: Record<string, string> = {
  navn: "Navn", name: "Navn", fornavn: "Fornavn", etternavn: "Etternavn", epost: "E-post", email: "E-post",
  telefon: "Telefon", phone: "Telefon", tlf: "Telefon", melding: "Melding", message: "Melding", firma: "Firma",
  company: "Firma", adresse: "Adresse", postnr: "Postnummer", sted: "Sted", tjeneste: "Tjeneste",
};
export function fieldLabel(key: string): string {
  if (LABELS[key.toLowerCase()]) return LABELS[key.toLowerCase()];
  const s = key.replace(/[_-]+/g, " ").replace(/([a-zæøå])([A-ZÆØÅ])/g, "$1 $2").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
export function formatValue(v: unknown): string {
  if (v == null || v === "") return "–";
  if (typeof v === "boolean") return v ? "Ja" : "Nei";
  if (Array.isArray(v)) return v.map(formatValue).join(", ");
  if (typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, x]) => `${fieldLabel(k)}: ${formatValue(x)}`).join("; ");
  return String(v);
}
/** Finn navn/e-post/telefon for listevisning. */
export function summary(data: unknown): { navn: string; epost: string | null; telefon: string | null } {
  const d = (data ?? {}) as Record<string, unknown>;
  const get = (...k: string[]) => { for (const x of k) { const v = d[x]; if (typeof v === "string" && v.trim()) return v.trim(); } return null; };
  const navn = get("navn", "name") ?? [get("fornavn"), get("etternavn")].filter(Boolean).join(" ");
  return { navn: navn || get("firma", "company") || "Uten navn", epost: get("epost", "email", "e-post"), telefon: get("telefon", "phone", "tlf") };
}

/** CSV med semikolon (Excel nb-NO), BOM og vern mot formel-injeksjon. */
export function csvCell(v: unknown): string {
  let s = formatValue(v); if (s === "–") s = "";
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
export function toCsv(rows: { createdAt: Date; form: string; status: string; data: unknown; notes?: string | null }[]): string {
  const keys = [...new Set(rows.flatMap((r) => Object.keys((r.data ?? {}) as object)))];
  const head = ["Dato", "Skjema", "Status", ...keys.map(fieldLabel), "Notat"];
  const lines = rows.map((r) => [r.createdAt.toISOString().replace("T", " ").slice(0, 16), r.form, r.status, ...keys.map((k) => (r.data as Record<string, unknown>)?.[k]), r.notes ?? ""].map(csvCell).join(";"));
  return "\uFEFF" + [head.map(csvCell).join(";"), ...lines].join("\r\n");
}

/** Varselmottakere: bare kundens EGNE registrerte brukere som selv har slått på varsel. */
export function notificationRecipients(users: { email: string; role: string; organizationId: string | null; notifyNewSubmissions: boolean }[], orgId: string): string[] {
  return users.filter((u) => u.organizationId === orgId && u.role === "CUSTOMER" && u.notifyNewSubmissions).map((u) => u.email);
}

/** «Svar»: mailto til avsenderen med «Re: …» og opprinnelig melding sitert. Null hvis ingen gyldig e-post. */
export function replyMailto(o: { data: unknown; formName: string; createdAt: Date }): string | null {
  const sum = summary(o.data);
  const to = sum.epost && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(sum.epost) ? sum.epost : null;
  if (!to) return null;
  const d = (o.data ?? {}) as Record<string, unknown>;
  const msgKey = Object.keys(d).find((k) => ["melding", "message", "beskjed", "kommentar"].includes(k.toLowerCase()));
  const original = msgKey ? formatValue(d[msgKey]) : Object.entries(d).map(([k, v]) => `${fieldLabel(k)}: ${formatValue(v)}`).join("\n");
  const when = new Intl.DateTimeFormat("nb-NO", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Oslo" }).format(o.createdAt);
  const subject = `Re: ${o.formName}${sum.navn && sum.navn !== "Uten navn" ? ` – ${sum.navn}` : ""}`;
  const body = `Hei${sum.navn && sum.navn !== "Uten navn" ? ` ${sum.navn.split(" ")[0]}` : ""},\n\n\n\n${when} skrev ${sum.navn}:\n${original.split("\n").map((l) => `> ${l}`).join("\n")}\n`;
  // encodeURIComponent (ikke URLSearchParams) så mellomrom blir %20 og ikke «+» i e-postklienten
  return `mailto:${encodeURIComponent(to).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Hovedbryter for e-postvarsel. Krever PORTAL_NOTIFY_ENABLED=1 OG grønn e-posthelse (Resend-domenet verifisert, ikke testmodus). */
export function portalNotifyGate(env: Record<string, string | undefined>, health: { ok: boolean; dryRun: boolean; reasons: string[] }): { on: boolean; reason?: string } {
  if (env.PORTAL_NOTIFY_ENABLED !== "1") return { on: false, reason: "PORTAL_NOTIFY_ENABLED er ikke satt til 1" };
  if (!health.ok) return { on: false, reason: health.reasons.join("; ") || "e-posthelse ikke ok" };
  if (health.dryRun) return { on: false, reason: "testmodus (OUTREACH_DRY_RUN)" };
  return { on: true };
}

const esc = (x: string) => x.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
/** Innhold i varselet: sammendrag (navn, kontakt, utdrag av melding) + lenke til innsendingen i portalen. */
export function alertContent(o: { id: string; formName: string; data: unknown; baseUrl: string }) {
  const sum = summary(o.data);
  const d = (o.data ?? {}) as Record<string, unknown>;
  const msgKey = Object.keys(d).find((k) => ["melding", "message", "beskjed", "kommentar"].includes(k.toLowerCase()));
  const msg = msgKey ? formatValue(d[msgKey]) : "";
  const utdrag = msg.length > 280 ? msg.slice(0, 277) + "…" : msg;
  const url = `${o.baseUrl.replace(/\/$/, "")}/customer/leads/${o.id}`;
  const linjer = [`Fra: ${sum.navn}`, sum.epost && `E-post: ${sum.epost}`, sum.telefon && `Telefon: ${sum.telefon}`, utdrag && `Melding: ${utdrag}`].filter(Boolean) as string[];
  const subject = `Ny henvendelse via ${o.formName} fra ${sum.navn}`.slice(0, 150);
  const text = `Du har fått en ny henvendelse via ${o.formName}.\n\n${linjer.join("\n")}\n\nÅpne i kundeportalen: ${url}\n\nDu får dette fordi du har slått på varsler. Slå av under Innstillinger i portalen.`;
  const html = `<p>Du har fått en ny henvendelse via <strong>${esc(o.formName)}</strong>.</p><p>${linjer.map(esc).join("<br>")}</p><p><a href="${esc(url)}">Åpne i kundeportalen</a></p><p style="color:#5F5A77;font-size:12px">Du får dette fordi du har slått på varsler. Slå av under Innstillinger i portalen.</p>`;
  return { subject, text, html, url };
}

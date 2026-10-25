// Fase 3 – ren logikk for oppfølgingssekvensen (ingen DB, ingen e-post). Testes i outreach-core.test.ts.
import { createHash, randomBytes } from "node:crypto";
import { isGenericEmail } from "./core";

/** Sekvens: dag 0, 4 og 10 regnet fra dag-0-sendingen (dag 0 = når André godkjenner). Pause etter dag 10 + 7 dager uten svar. */
export const SEQ_DAYS = [0, 4, 10] as const;
export const PAUSE_AFTER_LAST_DAYS = 7;
export const PAUSE_DAYS = 90;
export const WEEKLY_CAP = 20;
export const GDPR_MONTHS = 12;
/** Stages der sekvensen er aktiv. Alt annet (Svart, Møte, Tapt, Pause …) stopper den. */
export const SEQ_ACTIVE_STAGES = ["GODKJENT", "KONTAKTET"] as const;
export const STEG_LABEL = ["Dag 0", "Dag 4", "Dag 10"] as const;

const DAY = 86_400_000;

export function normEmail(e: string): string { return e.trim().toLowerCase(); }
export function suppressionHash(type: "epost" | "orgnr", value: string): string {
  const v = type === "epost" ? normEmail(value) : value.replace(/\D/g, "");
  return createHash("sha256").update(`${type}:${v}`).digest("hex");
}
export function newToken(): string { return randomBytes(24).toString("base64url"); }

/** AS/ASA i Brreg-kode eller tekst. Alt annet (ENK, ANS, DA, NUF, ukjent) er ikke tillatt for kald e-post. */
export function isAsOrAsa(orgform: string | null | undefined): boolean {
  const o = (orgform || "").trim().toUpperCase();
  return o === "AS" || o === "ASA" || o === "AKSJESELSKAP" || o === "ALLMENNAKSJESELSKAP";
}

export type FilterInput = {
  epost: string | null | undefined;
  orgform: string | null | undefined;
  suppressed: boolean;
  steg: number;
  newContactsLast7d: number; // antall dag-0-e-poster sendt siste 7 dager
};
/** Automatiseringsplan v2: bare generisk adresse hos AS/ASA, ikke sperret, maks ~20 nye kontakter per uke. */
export function recipientBlockers(i: FilterInput): string[] {
  const r: string[] = [];
  if (!i.epost) r.push("Mangler e-postadresse");
  else if (!isGenericEmail(i.epost)) r.push("Ikke en generisk adresse (post@, firmapost@, kontakt@ …) – personlige adresser krever samtykke");
  const of = (i.orgform || "").trim().toUpperCase();
  if (of === "ENK" || of === "ENKELTPERSONFORETAK") r.push("Enkeltpersonforetak (ENK) – ingen e-post uten samtykke");
  else if (!isAsOrAsa(i.orgform)) r.push(`Orgform ${i.orgform || "ukjent"} – kald e-post kun til AS/ASA`);
  if (i.suppressed) r.push("Står på sperrelisten (avmeldt / sa nei)");
  if (i.steg === 0 && i.newContactsLast7d >= WEEKLY_CAP) r.push(`Ukegrensen er nådd (${WEEKLY_CAP} nye kontakter siste 7 dager)`);
  return r;
}

export type MergeVars = { firma: string; kontakt?: string | null; demo_url?: string | null; svakhet?: string | null };
/** Fletter {firma} {kontakt} {demo_url} {svakhet}. Tomme verdier blir stående som {felt} så sending blokkeres. */
export function merge(tpl: string, v: MergeVars): string {
  const vals: Record<string, string | null | undefined> = {
    firma: v.firma, kontakt: v.kontakt || "dere", demo_url: v.demo_url, svakhet: v.svakhet,
  };
  return tpl.replace(/\{(firma|kontakt|demo_url|svakhet)\}/g, (m, k) => (vals[k]?.trim() ? vals[k]!.trim() : m));
}
export function unresolved(text: string): string[] {
  return [...new Set([...text.matchAll(/\{(firma|kontakt|demo_url|svakhet)\}/g)].map((m) => m[1]))];
}
/** 2–3 målte svakheter fra Company.svakheter (én per linje) som punktliste. */
export function svakhetTekst(svakheter: string | null | undefined): string | null {
  const l = (svakheter || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3);
  return l.length ? l.map((x) => `– ${x.replace(/^[-–•]\s*/, "")}`).join("\n") : null;
}

/** Fast bunntekst (avsender, merking, art. 14, avmelding). Kan ikke redigeres bort. */
export function footer(unsubUrl: string, kilde: string): string {
  return [
    "—",
    "Med vennlig hilsen",
    "André Aalborg, IntelliSense (intellisenseai.no) · +47 467 44 670",
    "",
    "Dette er en markedsføringshenvendelse til virksomhetens generelle e-postadresse.",
    `Hvorfor du får denne: vi fant ${kilde}. Vi behandler kun firmaopplysninger (berettiget interesse) og sletter dem etter 12 måneder uten kontakt. Personvern: https://intellisenseai.no/personvern`,
    `Ikke interessert? Meld av med ett klikk: ${unsubUrl}`,
  ].join("\n");
}

export function dueAt(step: number, day0Sent: Date): Date {
  return new Date(day0Sent.getTime() + SEQ_DAYS[step] * DAY);
}

export type SeqState = {
  stage: string;
  suppressed: boolean;
  drafts: { steg: number; status: string; sendtDato: Date | null }[];
};
export type SeqDecision =
  | { kind: "create"; steg: number; planlagtFor: Date }
  | { kind: "stop"; grunn: string }
  | { kind: "pause" }
  | { kind: "none" };

/** Hva cron skal gjøre for én deal. Lager aldri mer enn ett nytt utkast om gangen, og sender aldri. */
export function nextAction(s: SeqState, now: Date): SeqDecision {
  const pending = s.drafts.some((d) => d.status === "UTKAST");
  if (s.suppressed) return pending ? { kind: "stop", grunn: "Sperret (avmeldt/nei)" } : { kind: "none" };
  if (!(SEQ_ACTIVE_STAGES as readonly string[]).includes(s.stage)) return pending ? { kind: "stop", grunn: `Stage endret til ${s.stage}` } : { kind: "none" };
  if (s.drafts.some((d) => d.status === "STOPPET")) return { kind: "none" };
  const by = (n: number) => s.drafts.find((d) => d.steg === n);
  if (!by(0)) return s.stage === "GODKJENT" ? { kind: "create", steg: 0, planlagtFor: now } : { kind: "none" };
  const d0 = by(0)!;
  if (d0.status !== "SENDT" || !d0.sendtDato) return { kind: "none" };
  for (const n of [1, 2]) {
    const d = by(n);
    if (!d) {
      const due = dueAt(n, d0.sendtDato);
      return due.getTime() <= now.getTime() ? { kind: "create", steg: n, planlagtFor: due } : { kind: "none" };
    }
    if (d.status === "UTKAST") return { kind: "none" };
  }
  const last = by(2)!;
  const lastTime = (last.sendtDato ?? dueAt(2, d0.sendtDato)).getTime();
  if (now.getTime() >= lastTime + PAUSE_AFTER_LAST_DAYS * DAY) return { kind: "pause" };
  return { kind: "none" };
}

export function addMonths(d: Date, m: number): Date { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; }

/** Helsesjekk for avsender: EMAIL_FROM må være en @intellisenseai.no-adresse på et verifisert Resend-domene. */
export function fromAddress(emailFrom: string | undefined): string | null {
  const m = (emailFrom || "").match(/<?([^<>\s]+@([^<>\s]+))>?\s*$/);
  return m ? m[1].toLowerCase() : null;
}
export function healthFromParts(p: { emailFrom?: string; apiKey: boolean; domainStatus: string | null }): { ok: boolean; reasons: string[] } {
  const r: string[] = [];
  const addr = fromAddress(p.emailFrom);
  if (!addr) r.push("EMAIL_FROM er ikke satt");
  else if (!addr.endsWith("@intellisenseai.no")) r.push(`EMAIL_FROM (${addr}) er ikke en intellisenseai.no-adresse`);
  if (!p.apiKey) r.push("RESEND_API_KEY mangler");
  else if (p.domainStatus !== "verified") r.push(`Domenet intellisenseai.no er ikke verifisert i Resend (status: ${p.domainStatus ?? "ikke lagt til"})`);
  return { ok: r.length === 0, reasons: r };
}

// Ren logikk (ingen DB): arbeidstid i Europe/Oslo og kilde-kategori for «Innkommende». Testes i inbound.test.ts.
export const WORK_START_H = 8;
export const WORK_END_H = 17; // man–fre 08:00–17:00 Oslo (helligdager ikke trukket fra)

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
function osloParts(d: Date) {
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, s: +p.second };
}
/** Oslo-lokal tid → UTC-ms. */
function osloToUtc(y: number, m: number, d: number, h: number): number {
  const guess = Date.UTC(y, m - 1, d, h);
  const o = osloParts(new Date(guess));
  const asUtc = Date.UTC(o.y, o.m - 1, o.d, o.h, o.min, o.s);
  const off = asUtc - guess;
  return guess - off;
}
/** Antall arbeidsminutter (man–fre 08–17 Oslo) mellom to tidspunkt. */
export function workMinutesBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let total = 0;
  const s = osloParts(from);
  let day = Date.UTC(s.y, s.m - 1, s.d, 12); // kalenderdag (kun datoen brukes)
  const endDay = (() => { const e = osloParts(to); return Date.UTC(e.y, e.m - 1, e.d, 12); })();
  for (; day <= endDay; day += 86_400_000) {
    const c = new Date(day);
    const dow = c.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const ws = osloToUtc(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate(), WORK_START_H);
    const we = osloToUtc(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate(), WORK_END_H);
    const a = Math.max(ws, from.getTime()), b = Math.min(we, to.getTime());
    if (b > a) total += (b - a) / 60_000;
  }
  return Math.round(total);
}

export type KildeKategori = "skjema" | "epost_hei" | "chat" | "annet";
/** CrmActivity.kilde («nettside/kontakt», «nettside/epost#id», …) → kategori. */
export function kildeKategori(kilde: string | null | undefined): KildeKategori {
  const k = (kilde || "").toLowerCase().replace(/^nettside\//, "").split("#")[0];
  if (k === "kontakt" || k === "tilbud" || k === "ghl") return "skjema";
  if (k === "epost") return "epost_hei";
  if (k === "chat") return "chat";
  return "annet";
}

/** Auto-svar/no-reply skal ikke bli leads. */
export function isAutoSender(epost: string | null, autoSubmitted?: unknown): boolean {
  if (typeof autoSubmitted === "string" && autoSubmitted && autoSubmitted.toLowerCase() !== "no") return true;
  if (!epost) return false;
  return /^(no-?reply|do-?not-?reply|mailer-daemon|postmaster)@/i.test(epost);
}

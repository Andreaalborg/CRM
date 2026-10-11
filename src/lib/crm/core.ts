// Ren forretningslogikk for salgs-CRM-et (ingen DB/Next-avhengigheter, testes i core.test.ts).

export const STAGES = [
  "KVALIFISERT",
  "GODKJENT",
  "KONTAKTET",
  "SVART",
  "MOTE",
  "TILBUD",
  "VUNNET",
  "TAPT",
  "PAUSE",
] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  KVALIFISERT: "Kvalifisert",
  GODKJENT: "Godkjent for kontakt",
  KONTAKTET: "Kontaktet",
  SVART: "Svart",
  MOTE: "Møte/demo",
  TILBUD: "Tilbud sendt",
  VUNNET: "Vunnet",
  TAPT: "Tapt",
  PAUSE: "Pause",
};

/** Standard sannsynlighet per steg (brukes når sannsynlighetKilde = stage-default). */
export const STAGE_DEFAULT_PROB: Record<Stage, number> = {
  KVALIFISERT: 10,
  GODKJENT: 15,
  KONTAKTET: 20,
  SVART: 35,
  MOTE: 50,
  TILBUD: 70,
  VUNNET: 100,
  TAPT: 0,
  PAUSE: 5,
};

export const OPEN_STAGES: Stage[] = ["KVALIFISERT", "GODKJENT", "KONTAKTET", "SVART", "MOTE", "TILBUD"];

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

/** Neste/forrige steg for tastaturflytt. Returnerer null ved kanten. */
export function adjacentStage(stage: Stage, dir: -1 | 1): Stage | null {
  const i = STAGES.indexOf(stage) + dir;
  return i >= 0 && i < STAGES.length ? STAGES[i] : null;
}

/** Krav ved stegbytte. Tapt krever tapsårsak, Pause krever ny oppfølgingsdato. */
export function validateStageChange(
  to: Stage,
  opts: { tapsarsak?: string | null; nesteStegDato?: Date | null }
): string | null {
  if (to === "TAPT" && !opts.tapsarsak?.trim()) return "Tapt krever tapsårsak";
  if (to === "PAUSE" && !opts.nesteStegDato) return "Pause krever dato for ny oppfølging";
  return null;
}

/** Ny sannsynlighet ved stegbytte: manuell/leadhunter-verdi beholdes for åpne steg. */
export function probabilityAfterMove(to: Stage, current: number, kilde: string): number {
  if (to === "VUNNET" || to === "TAPT") return STAGE_DEFAULT_PROB[to];
  return kilde === "stage-default" ? STAGE_DEFAULT_PROB[to] : current;
}

/** Forventet verdi = sannsynlighet × verdi (avrundet til hele kroner). */
export function expectedValue(sannsynlighet: number, verdi: number | null | undefined): number {
  if (!verdi) return 0;
  const p = Math.min(100, Math.max(0, sannsynlighet));
  return Math.round((p / 100) * verdi);
}

/** Normaliserer orgnr: fjerner mellomrom/punktum/«NO»/«MVA». Returnerer null for tomt. */
export function normalizeOrgnr(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.toUpperCase().replace(/^NO/, "").replace(/MVA$/, "").replace(/[\s.\-]/g, "");
  return s === "" ? null : s;
}

/** Gyldig norsk orgnr: 9 siffer med modulus 11-kontrollsiffer (vekter 3,2,7,6,5,4,3,2). */
export function isValidOrgnr(orgnr: string): boolean {
  if (!/^\d{9}$/.test(orgnr)) return false;
  const w = [3, 2, 7, 6, 5, 4, 3, 2];
  const sum = w.reduce((acc, wi, i) => acc + wi * Number(orgnr[i]), 0);
  let k = 11 - (sum % 11);
  if (k === 11) k = 0;
  if (k === 10) return false;
  return k === Number(orgnr[8]);
}

/** Start på dagen i Europe/Oslo, returnert som UTC-Date. */
export function osloDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const ymd = fmt.format(now); // YYYY-MM-DD
  const offsetMin = osloOffsetMinutes(now);
  const start = new Date(Date.parse(`${ymd}T00:00:00Z`) - offsetMin * 60_000);
  const end = new Date(start.getTime() + 24 * 3600_000);
  return { start, end };
}

function osloOffsetMinutes(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Oslo",
    timeZoneName: "shortOffset",
  }).formatToParts(d);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const m = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!m) return 60;
  const h = Number(m[1]);
  return h * 60 + Math.sign(h) * Number(m[2] ?? 0);
}

export type DueState = "forfalt" | "i-dag" | "senere" | "ingen";

/** Hvor en oppfølging står i forhold til i dag (Oslo-tid). */
export function dueState(date: Date | null | undefined, now: Date = new Date()): DueState {
  if (!date) return "ingen";
  const { start, end } = osloDayBounds(now);
  if (date < start) return "forfalt";
  if (date < end) return "i-dag";
  return "senere";
}

/** Rekkefølge for kort etter flytt: legges nederst i målkolonnen. */
export function nextPosition(positions: number[]): number {
  return positions.length ? Math.max(...positions) + 1 : 0;
}

export function formatNok(n: number | null | undefined): string {
  if (n == null) return "–";
  return new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 }).format(n);
}

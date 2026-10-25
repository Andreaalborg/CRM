// André-regelen: ingen e-post sendes automatisk til andre enn André selv.
// Gamle automasjoner (skjema-automasjoner og process-jobs-cron) får bare sende INTERNE varsler til eierens egne adresser.

export const AUTO_EMAIL_DISABLED_MSG = "Automatisk utsending er slått av – e-post til andre krever Andrés godkjenning (fase 3-regelen)";
const DEFAULT_OWNER = ["andreaalborg@intellisenseai.no"];
// Overgang: eldre adresse som fortsatt er SUPER_ADMIN-innlogging i prod-DB. Beholdes som eier-alias til DB-bruker er migrert og verifisert. Fjernes etterpå.
const LEGACY_OWNER_ALIASES = ["andre.aalborg@intellisenseai.no"];

/** Ren funksjon (testes): er adressen en av eierens egne? */
export function ownerAllowed(email: string | null | undefined, owners: string[]): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  return owners.map((o) => o.trim().toLowerCase()).filter(Boolean).includes(e);
}

/** Eierens adresser: OWNER_NOTIFY_EMAILS (komma) + standardadressen + e-posten til SUPER_ADMIN-brukere. */
export async function ownerEmails(): Promise<string[]> {
  const { db } = await import("@/lib/db"); // lazy: ownerAllowed skal kunne testes uten DATABASE_URL
  const env = (process.env.OWNER_NOTIFY_EMAILS || "").split(",");
  const admins = (await db.user.findMany({ where: { role: "SUPER_ADMIN" }, select: { email: true } })).map((u) => u.email ?? "");
  return [...DEFAULT_OWNER, ...LEGACY_OWNER_ALIASES, ...env, ...admins].filter(Boolean);
}

export async function isOwnerAddress(email: string | null | undefined): Promise<boolean> {
  return ownerAllowed(email, await ownerEmails());
}

"use server";
// Fase 4 – kundeportal-handlinger. Alle spørringer er avgrenset til innlogget kundes organisasjon.
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { requireCustomer } from "./session";
import { newLoginToken, LINK_TTL_SELF_MIN, LINK_TTL_ADMIN_H } from "./core";

type R = { ok: true; msg?: string } | { ok: false; error: string };
const base = () => (process.env.CRM_PUBLIC_URL || process.env.NEXTAUTH_URL || "https://crm.intellisenseai.no").replace(/\/$/, "");

async function own(id: string, orgId: string) {
  return db.submission.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
}

export async function setHandled(id: string, handled: boolean): Promise<R> {
  const c = await requireCustomer({ redirectTo: false });
  if (!(await own(id, c.orgId))) return { ok: false, error: "Fant ikke henvendelsen" };
  await db.submission.update({ where: { id }, data: handled ? { handledAt: new Date(), status: "CONTACTED" } : { handledAt: null, contactedAt: null, status: "NEW" } });
  await db.activityLog.create({ data: { userId: c.userId, action: handled ? "portal.submission.handled" : "portal.submission.reopened", resource: "submission", resourceId: id } });
  revalidatePath("/customer", "layout");
  return { ok: true };
}

/** Markér som «Kontaktet» (eller angre). via = "svar" når det ble tilbudt etter Svar-knappen. */
export async function setContacted(id: string, contacted: boolean, via: "knapp" | "svar" = "knapp"): Promise<R> {
  const c = await requireCustomer({ redirectTo: false });
  if (!(await own(id, c.orgId))) return { ok: false, error: "Fant ikke henvendelsen" };
  await db.submission.update({ where: { id }, data: contacted ? { contactedAt: new Date(), status: "CONTACTED" } : { contactedAt: null, status: "NEW" } });
  await db.activityLog.create({ data: { userId: c.userId, action: contacted ? "portal.submission.contacted" : "portal.submission.uncontacted", resource: "submission", resourceId: id, details: { via } } });
  revalidatePath("/customer", "layout");
  return { ok: true, msg: contacted ? "Markert som kontaktet" : "Kontaktet er fjernet" };
}

export async function saveNote(id: string, _: unknown, f: FormData): Promise<R> {
  const c = await requireCustomer({ redirectTo: false });
  if (!(await own(id, c.orgId))) return { ok: false, error: "Fant ikke henvendelsen" };
  const notes = String(f.get("notes") ?? "").slice(0, 5000);
  await db.submission.update({ where: { id }, data: { notes: notes.trim() || null } });
  revalidatePath(`/customer/leads/${id}`);
  return { ok: true, msg: "Notatet er lagret" };
}

export async function saveSettings(_: unknown, f: FormData): Promise<R> {
  const c = await requireCustomer({ redirectTo: false });
  const name = String(f.get("name") ?? "").trim().slice(0, 100);
  await db.user.update({ where: { id: c.userId }, data: { name: name || null, notifyNewSubmissions: f.get("notify") === "on" } });
  revalidatePath("/customer", "layout");
  return { ok: true, msg: "Innstillingene er lagret" };
}

// Enkel rate-limit for forespørsel om lenke (per e-post og per IP, i minnet + DB-tak)
const hits = new Map<string, number[]>();
function limited(key: string, max: number) {
  const now = Date.now(); const a = (hits.get(key) || []).filter((t) => now - t < 15 * 60_000); a.push(now); hits.set(key, a); return a.length > max;
}

/** Kunden ber selv om innloggingslenke. Svarer alltid likt (avslører ikke om kontoen finnes). */
export async function requestMagicLink(_: unknown, f: FormData): Promise<R> {
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const generic: R = { ok: true, msg: "Hvis e-postadressen er registrert hos oss, får du en innloggingslenke om litt. Den virker i 15 minutter." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Skriv en gyldig e-postadresse" };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "ukjent";
  if (limited(`ip:${ip}`, 10) || limited(`e:${email}`, 3)) return generic;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "CUSTOMER" || !user.organizationId) return generic;
  const recent = await db.loginToken.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
  if (recent >= 3) return generic;
  const { token, hash } = newLoginToken();
  await db.loginToken.create({ data: { tokenHash: hash, userId: user.id, expiresAt: new Date(Date.now() + LINK_TTL_SELF_MIN * 60_000) } });
  // Transaksjonell e-post til brukeren selv (som glemt passord) – OK etter André-regelen.
  await sendEmail({
    to: user.email, from: process.env.EMAIL_FROM,
    subject: "Innloggingslenke til kundeportalen",
    html: `<p>Hei${user.name ? " " + user.name.replace(/[<>&]/g, "") : ""},</p><p><a href="${base()}/customer/login/${token}">Logg inn i kundeportalen</a></p><p>Lenken virker i ${LINK_TTL_SELF_MIN} minutter og kan brukes én gang. Ba du ikke om den, kan du se bort fra e-posten.</p>`,
  });
  return generic;
}

/** Admin lager engangslenke i CRM (vises én gang) – så piloten kan starte uten e-post. */
export async function createLoginLink(userId: string): Promise<{ ok: true; url: string; expiresAt: string } | { ok: false; error: string }> {
  const s = await getServerSession(authOptions);
  if (!s || s.user.role !== "SUPER_ADMIN") return { ok: false, error: "Ikke autorisert" };
  const u = await db.user.findUnique({ where: { id: userId } });
  if (!u || u.role !== "CUSTOMER" || !u.organizationId) return { ok: false, error: "Lenker kan bare lages for kundebrukere med organisasjon" };
  const { token, hash } = newLoginToken();
  const expiresAt = new Date(Date.now() + LINK_TTL_ADMIN_H * 3600_000);
  await db.loginToken.create({ data: { tokenHash: hash, userId, expiresAt, createdById: s.user.id } });
  await db.activityLog.create({ data: { userId: s.user.id, action: "portal.loginlink.created", resource: "user", resourceId: userId } });
  return { ok: true, url: `${base()}/customer/login/${token}`, expiresAt: expiresAt.toISOString() };
}

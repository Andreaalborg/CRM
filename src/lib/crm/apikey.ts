// Hjelpere for bot-API-nøkler og signerte webhooks. Ingen DB-avhengigheter (testes i apikey.test.ts).
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { Scope } from "./apikey-scopes";
export { SCOPES, SCOPE_LABEL, type Scope } from "./apikey-scopes";

export const KEY_PREFIX = "isk_";

export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(32).toString("base64url");
}

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

/** Leser nøkkel fra «Authorization: Bearer …» eller «X-API-Key». */
export function extractApiKey(h: Headers): string | null {
  const auth = h.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim() || null;
  return h.get("x-api-key")?.trim() || null;
}

export function hasScope(scopes: string[], needed: Scope): boolean {
  return scopes.includes(needed);
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8"), bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Signatur for innkommende webhooks: hex(HMAC-SHA256(secret, `${timestamp}.${body}`)). */
export function signBody(secret: string, timestamp: string, body: string): string {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
}

/**
 * Verifiserer en signert webhook. Godtar:
 *  - X-IS-Timestamp (unix sek) + X-IS-Signature: sha256=<hex>, maks 5 min gammel, eller
 *  - X-IS-Key: <secret> (statisk nøkkel, for systemer som ikke kan signere, f.eks. GHL-webhook).
 */
export function verifyInbound(
  secret: string | undefined,
  h: Headers,
  body: string,
  nowSec = Math.floor(Date.now() / 1000)
): { ok: true; method: "hmac" | "key" } | { ok: false; reason: string } {
  if (!secret || secret.length < 16) return { ok: false, reason: "Innkommende hemmelighet er ikke konfigurert" };
  const sig = h.get("x-is-signature");
  const ts = h.get("x-is-timestamp");
  if (sig && ts) {
    const t = Number(ts);
    if (!Number.isFinite(t) || Math.abs(nowSec - t) > 300) return { ok: false, reason: "Utløpt eller ugyldig tidsstempel" };
    const expected = "sha256=" + signBody(secret, ts, body);
    return safeEqualHex(sig, expected) ? { ok: true, method: "hmac" } : { ok: false, reason: "Ugyldig signatur" };
  }
  const key = h.get("x-is-key");
  if (key) return safeEqualHex(hashApiKey(key), hashApiKey(secret)) ? { ok: true, method: "key" } : { ok: false, reason: "Ugyldig nøkkel" };
  return { ok: false, reason: "Mangler signatur" };
}

// Kanonisk base-URL for lenker som sendes ut eller vises (innloggingslenker, innebygging, varsler).
// Bruker aldri NEXTAUTH_URL/VERCEL_URL: de peker på *.vercel.app (bak SSO, gir 404 for kunder).
export const CANONICAL_BASE_URL = "https://crm.intellisenseai.no";
export function appBaseUrl(): string {
  return (process.env.CRM_PUBLIC_URL || CANONICAL_BASE_URL).replace(/\/$/, "");
}

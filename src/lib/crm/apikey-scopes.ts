export const SCOPES = ["leads:read", "leads:write", "activities:write"] as const;
export type Scope = (typeof SCOPES)[number];
export const SCOPE_LABEL: Record<Scope, string> = {
  "leads:read": "Lese leads/firma",
  "leads:write": "Opprette/oppdatere leads/firma (research-felt)",
  "activities:write": "Logge aktiviteter",
};

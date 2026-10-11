import { db } from "@/lib/db";
import { PageHeader } from "@/components/crm/PageHeader";
import { ApiKeyForm, RevokeButton } from "@/components/crm/ApiKeys";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InnstillingerPage() {
  const keys = await db.botApiKey.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Innstillinger" description="API-nøkler for boter (/api/v1). Nøkkelen vises bare én gang og lagres kun som hash." />
      <section className="crm-card p-4 sm:p-6" aria-labelledby="h-nokler">
        <h2 id="h-nokler" className="mb-3 font-semibold">API-nøkler ({keys.filter((k) => !k.revokedAt).length} aktive)</h2>
        <ul className="divide-y divide-brand-border">
          {keys.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="font-medium">{k.navn} <span className="font-mono text-xs text-brand-muted">{k.prefix}…</span>{k.revokedAt && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-800">Tilbakekalt</span>}</p>
                <p className="text-xs text-brand-muted">{k.scopes.join(", ")} · opprettet {formatDateTime(k.createdAt)} · sist brukt {k.lastUsedAt ? formatDateTime(k.lastUsedAt) : "aldri"}</p>
              </div>
              {!k.revokedAt && <RevokeButton id={k.id} navn={k.navn} />}
            </li>
          ))}
          {!keys.length && <li className="py-3 text-sm text-brand-muted">Ingen nøkler ennå.</li>}
        </ul>
      </section>
      <section className="crm-card p-4 sm:p-6" aria-labelledby="h-ny">
        <h2 id="h-ny" className="mb-3 font-semibold">Ny API-nøkkel</h2>
        <ApiKeyForm />
        <p className="mt-4 text-xs text-brand-muted">Boter kan aldri sette «Godkjent for kontakt» eller senere steg, og ingen API-endepunkt sender e-post. Maks 120 kall/min per nøkkel. Alle endringer audit-logges med botens navn.</p>
      </section>
    </div>
  );
}

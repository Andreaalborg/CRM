"use client";
import { startTransition, useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createApiKey, revokeApiKey } from "@/lib/crm/actions";
import { SCOPE_LABEL, SCOPES } from "@/lib/crm/apikey-scopes";

export function ApiKeyForm() {
  const [state, action, pending] = useActionState(createApiKey, null);
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}>
        <div>
          <label htmlFor="k-navn" className="crm-label">Navn på bot</label>
          <input id="k-navn" name="navn" required className="crm-input" placeholder="lead-hunter" />
        </div>
        <fieldset>
          <legend className="crm-label">Rettigheter</legend>
          {SCOPES.map((s) => (
            <label key={s} className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" name={`scope:${s}`} defaultChecked={s !== "leads:write"} className="h-4 w-4" /> <code>{s}</code> – {SCOPE_LABEL[s]}
            </label>
          ))}
        </fieldset>
        {state && !state.ok && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
        <button type="submit" className="crm-btn" disabled={pending}>{pending ? "Lager …" : "Lag nøkkel"}</button>
      </form>
      {state?.ok && (
        <div role="status" className="mt-4 rounded-xl border border-amber-600/40 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Nøkkel for «{state.navn}». Kopier den nå – den vises aldri igjen.</p>
          <code data-testid="ny-nokkel" className="mt-2 block break-all rounded bg-white p-2 font-mono text-sm">{state.key}</code>
          <button type="button" className="crm-btn-ghost mt-2" onClick={() => { navigator.clipboard?.writeText(state.key); setCopied(true); }}>{copied ? "Kopiert" : "Kopier"}</button>
        </div>
      )}
    </div>
  );
}

export function RevokeButton({ id, navn }: { id: string; navn: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="crm-btn-ghost text-red-800" disabled={pending}
      onClick={() => confirm(`Tilbakekalle nøkkelen «${navn}»? Boten mister tilgang med en gang.`) && start(async () => { await revokeApiKey(id); router.refresh(); })}>
      Tilbakekall
    </button>
  );
}

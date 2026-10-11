"use client";
import { useState, useTransition } from "react";
import { createLoginLink } from "@/lib/portal/actions";

/** Admin: lag engangs-innloggingslenke (24 t) og vis den én gang – piloten kan starte uten e-post. */
export function LoginLinkButton({ userId, email }: { userId: string; email: string }) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<{ url: string; expiresAt: string } | { error: string } | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" className="crm-btn-ghost text-xs" disabled={pending} aria-label={`Lag engangs-innloggingslenke for ${email}`}
        onClick={() => start(async () => { const r = await createLoginLink(userId); setRes(r.ok ? { url: r.url, expiresAt: r.expiresAt } : { error: r.error }); })}>
        {pending ? "Lager …" : "Lag innloggingslenke"}
      </button>
      {res && "url" in res && (
        <div role="status" className="max-w-xs rounded border border-[var(--color-brand-border)] bg-white p-2 text-xs">
          <label className="block font-medium" htmlFor={`ll-${userId}`}>Engangslenke (vises bare nå, gyldig 24 t):</label>
          <input id={`ll-${userId}`} readOnly value={res.url} className="crm-input mt-1 text-xs" onFocus={(e) => e.currentTarget.select()} data-testid="login-link" />
          <button type="button" className="crm-btn-ghost mt-1 text-xs" onClick={() => navigator.clipboard?.writeText(res.url)}>Kopier</button>
        </div>
      )}
      {res && "error" in res && <p role="alert" className="text-xs text-red-800">{res.error}</p>}
    </div>
  );
}

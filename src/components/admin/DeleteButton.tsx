"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

/** Sletter via DELETE-endepunkt etter bekreftelsesdialog. Viser feil synlig (ikke stille). */
export function DeleteButton({ url, confirmText, label, ariaLabel, redirectTo, iconOnly = false, className = "" }: {
  url: string; confirmText: string; label: string; ariaLabel?: string; redirectTo?: string; iconOnly?: boolean; className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run() {
    if (!window.confirm(confirmText)) return;
    setBusy(true); setError("");
    try {
      const r = await fetch(url, { method: "DELETE" });
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error || `Sletting feilet (${r.status})`); return; }
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch { setError("Sletting feilet. Sjekk nettverket og prøv igjen."); }
    finally { setBusy(false); }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={busy} aria-label={ariaLabel ?? label} title={label}
        className={className || "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500 px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"}>
        <Trash2 className="h-4 w-4" aria-hidden="true" />{!iconOnly && (busy ? "Sletter …" : label)}
      </button>
      {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
    </span>
  );
}

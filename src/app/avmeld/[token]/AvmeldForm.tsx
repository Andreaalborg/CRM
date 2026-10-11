"use client";
import { useState, useTransition } from "react";
import { unsubscribeAction } from "@/lib/crm/outreach-actions";

export function AvmeldForm({ token, til }: { token: string; til: string }) {
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const [pending, start] = useTransition();
  if (state === "ok") return <p role="status" className="mt-3 rounded-lg bg-green-50 border border-green-700 p-3 text-green-900">Takk. <strong>{til}</strong> er meldt av og vil ikke få flere e-poster fra oss.</p>;
  return (
    <div className="mt-3 space-y-3">
      <p className="text-slate-700">Vil du at <strong>{til}</strong> ikke skal få flere e-poster fra IntelliSense? Adressen legges på sperrelisten vår for alltid.</p>
      {state === "err" && <p role="alert" className="text-red-800">Noe gikk galt. Prøv igjen, eller send e-post til andreaalborg@intellisenseai.no.</p>}
      <button type="button" disabled={pending} onClick={() => start(async () => setState((await unsubscribeAction(token)).ok ? "ok" : "err"))}
        className="w-full rounded-lg bg-[var(--color-brand,#4f2fd0)] px-4 py-3 font-semibold text-white min-h-[44px] disabled:opacity-60">
        {pending ? "Melder av …" : "Meld av"}
      </button>
    </div>
  );
}

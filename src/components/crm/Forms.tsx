"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import type { ActionResult } from "@/lib/crm/actions";
import { STAGES, STAGE_LABEL } from "@/lib/crm/core";

type Act = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;

export function Field({ name, label, type = "text", defaultValue, required, placeholder, hint, ...rest }: {
  name: string; label: string; type?: string; defaultValue?: string | number | null; required?: boolean; placeholder?: string; hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="crm-label">{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue ?? undefined} required={required} placeholder={placeholder}
        aria-describedby={hint ? `${id}-hint` : undefined} className="crm-input" {...rest} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function Area({ name, label, defaultValue, rows = 3, hint }: { name: string; label: string; defaultValue?: string | null; rows?: number; hint?: string }) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="crm-label">{label}</label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue ?? undefined} className="crm-input" aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-brand-muted">{hint}</p>}
    </div>
  );
}

export function Choice({ name, label, options, defaultValue, empty }: { name: string; label: string; options: [string, string][]; defaultValue?: string | null; empty?: string }) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="crm-label">{label}</label>
      <select id={id} name={name} defaultValue={defaultValue ?? ""} className="crm-input">
        {empty !== undefined && <option value="">{empty}</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function Submit({ label, pending }: { label: string; pending: boolean }) {
  return <button type="submit" className="crm-btn" disabled={pending}>{pending ? "Lagrer…" : label}</button>;
}

export function ActionForm({ action, submitLabel, children, className, resetOnSuccess, successText }: {
  action: Act; submitLabel: string; children: React.ReactNode; className?: string; resetOnSuccess?: boolean; successText?: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && resetOnSuccess) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <form ref={ref} className={className ?? "space-y-4"}
      // onSubmit i stedet for action={…}: React 19 nullstiller skjemaet etter action, også ved valideringsfeil.
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => formAction(fd)); }}>
      {children}
      {state && !state.ok && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
      {state?.ok && successText && <p role="status" className="text-sm text-green-800">{successText}</p>}
      <Submit label={submitLabel} pending={pending} />
    </form>
  );
}

export const KILDER: [string, string][] = [["LEAD_APP", "Lead-app"], ["NETTSIDE", "Nettside-skjema"], ["HENVISNING", "Henvisning"], ["ANNET", "Annet"]];
export const PAKKER: [string, string][] = [["STARTER", "Starter"], ["VEKST", "Vekst"], ["PREMIUM", "Premium"], ["EGENDEFINERT", "Egendefinert"]];
export const STEG: [string, string][] = STAGES.map((s) => [s, STAGE_LABEL[s]]);

export function CompanyFields({ c }: { c?: Record<string, string | number | null> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="navn" label="Navn" required defaultValue={c?.navn} />
      <Field name="orgnr" label="Orgnr" inputMode="numeric" defaultValue={c?.orgnr} hint="9 siffer. Unikt – samme orgnr kan ikke lagres to ganger." />
      <Field name="orgform" label="Orgform" defaultValue={c?.orgform} placeholder="AS, ENK …" />
      <Field name="bransje" label="Bransje" defaultValue={c?.bransje} />
      <Field name="kommune" label="Kommune" defaultValue={c?.kommune} />
      <Field name="nettside" label="Nettside" type="url" defaultValue={c?.nettside} placeholder="https://" />
      <Field name="generiskEpost" label="Generisk e-post" type="email" defaultValue={c?.generiskEpost} placeholder="post@firma.no" />
      <Field name="telefon" label="Telefon" type="tel" defaultValue={c?.telefon} />
      <Field name="ansatte" label="Ansatte" type="number" min={0} defaultValue={c?.ansatte} />
      <Field name="demoUrl" label="Demo-URL" type="url" defaultValue={c?.demoUrl} />
      <div className="sm:col-span-2"><Area name="svakheter" label="Svakheter (målinger og dato, én per linje)" defaultValue={c?.svakheter as string} /></div>
      <div className="sm:col-span-2"><Area name="salgsvinkel" label="Salgsvinkel" defaultValue={c?.salgsvinkel as string} /></div>
      <div className="sm:col-span-2"><Area name="notater" label="Notater" defaultValue={c?.notater as string} /></div>
    </div>
  );
}

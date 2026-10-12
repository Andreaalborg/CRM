"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ActionResult } from "@/lib/crm/actions";
import { STAGES, STAGE_LABEL } from "@/lib/crm/core";

type FieldErr = { field?: string; error: string; link?: { href: string; label: string } } | null;
const FieldErrorCtx = createContext<FieldErr>(null);

function useFieldError(name: string) {
  const e = useContext(FieldErrorCtx);
  return e && e.field === name ? e : null;
}

function FieldError({ id, err }: { id: string; err: NonNullable<FieldErr> }) {
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-800">
      {err.error}{err.link && <> · <Link href={err.link.href} className="underline underline-offset-2">{err.link.label}</Link></>}
    </p>
  );
}

type Act = (prev: ActionResult | null, f: FormData) => Promise<ActionResult>;

export function Field({ name, label, type = "text", defaultValue, required, placeholder, hint, ...rest }: {
  name: string; label: string; type?: string; defaultValue?: string | number | null; required?: boolean; placeholder?: string; hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "name">) {
  const id = `f-${name}`;
  const err = useFieldError(name);
  const describedBy = [err && `${id}-feil`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="crm-label">{label}{required && <span aria-hidden="true"> *</span>}</label>
      <input id={id} name={name} type={type} defaultValue={defaultValue ?? undefined} required={required} placeholder={placeholder}
        aria-describedby={describedBy} aria-invalid={err ? true : undefined}
        className={err ? "crm-input border-red-700 ring-1 ring-red-700" : "crm-input"} {...rest} />
      {err && <FieldError id={`${id}-feil`} err={err} />}
      {type === "date" && <DateEcho inputId={id} />}
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-brand-muted">{hint}</p>}
    </div>
  );
}

export function Area({ name, label, defaultValue, rows = 3, hint }: { name: string; label: string; defaultValue?: string | null; rows?: number; hint?: string }) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="crm-label">{label}</label>
      <textarea id={id} name={name} rows={rows} defaultValue={defaultValue ?? undefined} className="crm-input" aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-brand-muted">{hint}</p>}
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
  useEffect(() => {
    if (state && !state.ok && state.field) ref.current?.querySelector<HTMLElement>(`[name="${state.field}"]`)?.focus();
  }, [state]);
  const fieldErr: FieldErr = state && !state.ok && state.field ? state : null;
  return (
    <FieldErrorCtx.Provider value={fieldErr}>
    <form ref={ref} className={className ?? "space-y-4"}
      // onSubmit i stedet for action={…}: React 19 nullstiller skjemaet etter action, også ved valideringsfeil.
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => formAction(fd)); }}>
      {children}
      {state && !state.ok && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}{state.link && <> · <Link href={state.link.href} className="underline underline-offset-2">{state.link.label}</Link></>}</p>}
      {state?.ok && successText && <p role="status" className="text-sm text-green-800">{successText}</p>}
      <Submit label={submitLabel} pending={pending} />
    </form>
    </FieldErrorCtx.Provider>
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

const nbDate = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function osloIsoInDays(days: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date(Date.now() + days * 86400_000));
}

/** Viser valgt dato som «12. okt. 2026» (nettleserens datovelger følger OS-locale) + hurtigvalg. */
function DateEcho({ inputId }: { inputId: string }) {
  const [v, setV] = useState("");
  useEffect(() => {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (!el) return;
    const sync = () => setV(el.value);
    sync();
    el.addEventListener("input", sync); el.addEventListener("change", sync);
    const form = el.form; const onReset = () => setTimeout(sync, 0);
    form?.addEventListener("reset", onReset);
    return () => { el.removeEventListener("input", sync); el.removeEventListener("change", sync); form?.removeEventListener("reset", onReset); };
  }, [inputId]);
  const pick = (days: number) => {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (!el) return;
    const d = osloIsoInDays(days);
    el.value = d; setV(d);
  };
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="text-brand-muted" aria-live="polite">{v ? nbDate.format(new Date(v + "T00:00:00Z")) : "Ingen dato valgt"}</span>
      <span aria-hidden="true" className="text-brand-muted">·</span>
      {([["I dag", 0], ["I morgen", 1], ["Neste uke", 7]] as const).map(([l, n]) => (
        <button key={l} type="button" onClick={() => pick(n)} className="crm-focus rounded-md px-1.5 py-0.5 font-medium text-brand hover:bg-brand-surface2">{l}</button>
      ))}
    </div>
  );
}

/** «+ Ny …»-knapp som åpner et skjema (designreview B6). */
export function Expander({ label, children, defaultOpen = false }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group" open={defaultOpen}>
      <summary className="crm-btn-ghost w-full cursor-pointer list-none sm:w-auto [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">+ {label}</span><span className="hidden group-open:inline">Lukk skjema</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

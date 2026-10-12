"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setHandled, setContacted, saveNote, saveSettings } from "@/lib/portal/actions";

export function HandledToggle({ id, handled }: { id: string; handled: boolean }) {
  const [pending, start] = useTransition(); const router = useRouter();
  return (
    <button type="button" className={handled ? "crm-btn-ghost" : "crm-btn"} disabled={pending} aria-pressed={handled}
      onClick={() => start(async () => { await setHandled(id, !handled); router.refresh(); })}>
      {handled ? "Merk som ny" : "Merk som håndtert"}
    </button>
  );
}
export function NoteForm({ id, notes }: { id: string; notes: string }) {
  const [state, action, pending] = useActionState(saveNote.bind(null, id), null);
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="notes" className="crm-label">Internt notat (bare synlig for dere)</label>
      <textarea id="notes" name="notes" defaultValue={notes} rows={4} className="crm-input" />
      <button className="crm-btn" disabled={pending}>Lagre notat</button>
      {state && <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-green-800" : "text-red-800"}`}>{state.ok ? state.msg : state.error}</p>}
    </form>
  );
}
export function SettingsForm({ name, notify, blocked }: { name: string; notify: boolean; blocked: string | null }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  return (
    <form action={action} className="space-y-4">
      <div><label htmlFor="name" className="crm-label">Navn</label><input id="name" name="name" defaultValue={name} className="crm-input" autoComplete="name" /></div>
      <fieldset className="space-y-2">
        <legend className="crm-label">Varsler</legend>
        <label className="flex min-h-[44px] items-start gap-3">
          <input type="checkbox" name="notify" defaultChecked={notify} className="mt-1 h-5 w-5 accent-[var(--color-brand)]" aria-describedby="notify-help" />
          <span>Send meg e-post når det kommer en ny henvendelse</span>
        </label>
        <p id="notify-help" className="text-sm text-[var(--color-brand-muted)]">Gjelder bare deg. Av som standard.{blocked ? ` Merk: e-postvarsler er midlertidig ikke aktivert av IntelliSense (${blocked}). Valget ditt lagres og tas i bruk når det er klart.` : ""}</p>
      </fieldset>
      <button className="crm-btn" disabled={pending}>Lagre</button>
      {state && <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-green-800" : "text-red-800"}`}>{state.ok ? state.msg : state.error}</p>}
    </form>
  );
}

export function ContactedToggle({ id, contacted }: { id: string; contacted: boolean }) {
  const [pending, start] = useTransition(); const router = useRouter();
  return (
    <button type="button" className="crm-btn-ghost" disabled={pending} aria-pressed={contacted}
      onClick={() => start(async () => { await setContacted(id, !contacted); router.refresh(); })}>
      {contacted ? "Fjern «Kontaktet»" : "Markér som kontaktet"}
    </button>
  );
}

/** «Svar» åpner kundens egen e-postklient (mailto). Etterpå tilbys ett klikk «Markér som kontaktet?». */
export function ReplyButton({ id, href, contacted, compact = false, navn }: { id: string; href: string; contacted: boolean; compact?: boolean; navn: string }) {
  const [asked, setAsked] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition(); const router = useRouter();
  return (
    <div className={compact ? "flex flex-wrap items-center gap-2" : "contents"}>
      <a href={href} className={compact ? "crm-btn-ghost text-sm" : "crm-btn"} aria-label={compact ? `Svar ${navn} på e-post` : undefined}
        onClick={() => { if (!contacted) setAsked(true); }}>Svar</a>
      {asked && !msg && (
        <div role="group" aria-label="Markér som kontaktet?" className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-tint)] px-3 py-1.5 text-sm">
          <span className="font-medium">Markér som kontaktet?</span>
          <button type="button" className="crm-btn min-h-[44px] px-3 text-sm" disabled={pending}
            onClick={() => start(async () => { const r = await setContacted(id, true, "svar"); setMsg(r.ok ? "Markert som kontaktet" : r.error); router.refresh(); })}>Ja, markér</button>
          <button type="button" className="crm-btn-ghost min-h-[44px] px-3 text-sm" onClick={() => setAsked(false)}>Nei</button>
        </div>
      )}
      {msg && <p role="status" className="text-sm text-green-800">{msg}</p>}
    </div>
  );
}

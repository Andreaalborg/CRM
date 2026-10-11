"use client";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setHandled, saveNote, saveSettings } from "@/lib/portal/actions";

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

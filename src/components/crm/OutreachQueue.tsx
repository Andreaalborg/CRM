"use client";
import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, SkipForward, Pencil, MessageSquareReply, Ban } from "lucide-react";
import { sendDraft, skipDraft, saveDraft, markReplied, markNo } from "@/lib/crm/outreach-actions";

export type QueueItem = {
  id: string; dealId: string; companyId: string; firma: string; til: string; steg: string;
  emne: string; tekst: string; footer: string; blockers: string[]; planlagt: string;
};

export function OutreachQueue({ items, health }: { items: QueueItem[]; health: { ok: boolean; reasons: string[]; dryRun: boolean } }) {
  const sendEnabled = health.ok || health.dryRun;
  return (
    <section className="crm-card mb-6 p-4 sm:p-6" aria-labelledby="utsend">
      <h2 id="utsend" className="mb-1 font-semibold">Til utsending ({items.length})</h2>
      <p className="mb-3 text-sm text-brand-muted">Utkast fra oppfølgingssekvensen (dag 0, 4 og 10). Ingenting sendes før du trykker Send på det enkelte utkastet og bekrefter.</p>
      {health.dryRun && <p role="status" className="mb-3 rounded-lg border border-amber-700 bg-amber-50 p-3 text-sm text-amber-900"><strong>Testmodus:</strong> Send logger e-posten, men Resend kalles ikke.</p>}
      {!sendEnabled && (
        <div role="note" className="mb-3 rounded-lg border border-red-700 bg-red-50 p-3 text-sm text-red-900" id="send-av">
          <strong>Sending er slått av.</strong> {health.reasons.join(" · ")}. Send-knappen åpnes når EMAIL_FROM er en verifisert intellisenseai.no-adresse i Resend.
        </div>
      )}
      {items.length === 0 && <p className="text-sm text-brand-muted">Ingen utkast venter.</p>}
      <ul className="space-y-4">{items.map((d) => <Draft key={d.id} d={d} sendEnabled={sendEnabled} />)}</ul>
    </section>
  );
}

function Draft({ d, sendEnabled }: { d: QueueItem; sendEnabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saveState, saveAction, saving] = useActionState(saveDraft.bind(null, d.id), null);
  const blocked = d.blockers.length > 0;
  const canSend = sendEnabled && !blocked;
  const run = (fn: () => Promise<{ ok: boolean; error?: string; dryRun?: boolean }>, okText: string) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: r.dryRun ? `${okText} (testmodus – ikke sendt)` : okText } : { ok: false, text: r.error ?? "Feil" });
      setConfirm(false);
      router.refresh();
    });
  const hid = `d-${d.id}`;
  return (
    <li className="rounded-xl border border-brand-border p-3 sm:p-4" aria-labelledby={`${hid}-t`}>
      <div className="flex flex-wrap items-center gap-2">
        <Link id={`${hid}-t`} href={`/dashboard/crm/firma/${d.companyId}`} className="font-semibold text-brand hover:underline">{d.firma}</Link>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">{d.steg}</span>
        <span className="text-sm text-brand-muted break-all">til {d.til}</span>
      </div>
      {blocked && (
        <ul className="mt-2 list-disc space-y-1 rounded-lg border border-red-700 bg-red-50 p-3 pl-7 text-sm text-red-900" aria-label="Blokkert">
          {d.blockers.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}
      {!edit ? (
        <div className="mt-3 rounded-lg border border-brand-border bg-slate-50 p-3 text-sm" aria-label="Forhåndsvisning">
          <p><span className="text-brand-muted">Emne:</span> <strong>{d.emne}</strong></p>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans">{d.tekst}</pre>
          <pre className="mt-3 whitespace-pre-wrap break-words border-t border-brand-border pt-2 font-sans text-xs text-slate-700">{d.footer}</pre>
        </div>
      ) : (
        <form action={saveAction} className="mt-3 space-y-2" onSubmit={() => setTimeout(() => router.refresh(), 300)}>
          <label className="crm-label" htmlFor={`${hid}-emne`}>Emne</label>
          <input id={`${hid}-emne`} name="emne" defaultValue={d.emne} className="crm-input" required />
          <label className="crm-label" htmlFor={`${hid}-tekst`}>Tekst (bunntekst med avsender, personvern og avmelding legges alltid til)</label>
          <textarea id={`${hid}-tekst`} name="tekst" defaultValue={d.tekst} rows={10} className="crm-input" required />
          {saveState && !saveState.ok && <p role="alert" className="text-sm text-red-800">{saveState.error}</p>}
          <div className="flex gap-2">
            <button className="crm-btn" disabled={saving}>Lagre</button>
            <button type="button" className="crm-btn-ghost" onClick={() => setEdit(false)}>Lukk</button>
          </div>
        </form>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm ${msg.ok ? "text-green-800" : "text-red-800"}`}>{msg.text}</p>}
      {confirm ? (
        <div className="mt-3 rounded-lg border border-brand p-3" role="group" aria-label="Bekreft sending">
          <p className="text-sm">Sende «{d.emne}» til <strong>{d.til}</strong> nå? Dette sender én e-post.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="crm-btn" disabled={pending} onClick={() => run(() => sendDraft(d.id), "Sendt")} autoFocus>Bekreft og send</button>
            <button type="button" className="crm-btn-ghost" onClick={() => setConfirm(false)}>Avbryt</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="crm-btn" disabled={!canSend || pending} aria-describedby={!sendEnabled ? "send-av" : undefined}
            title={!sendEnabled ? "Sending er slått av til Resend-domenet er verifisert" : blocked ? "Utkastet er blokkert" : undefined}
            onClick={() => setConfirm(true)}><Send className="h-4 w-4" aria-hidden="true" /> Send …</button>
          <button type="button" className="crm-btn-ghost" onClick={() => setEdit((e) => !e)} aria-expanded={edit}><Pencil className="h-4 w-4" aria-hidden="true" /> Rediger</button>
          <button type="button" className="crm-btn-ghost" disabled={pending} onClick={() => run(() => skipDraft(d.id), "Hoppet over")}><SkipForward className="h-4 w-4" aria-hidden="true" /> Hopp over</button>
          <button type="button" className="crm-btn-ghost" disabled={pending} onClick={() => run(() => markReplied(d.dealId), "Markert som svart – sekvensen stoppet")}><MessageSquareReply className="h-4 w-4" aria-hidden="true" /> Svar mottatt</button>
          <button type="button" className="crm-btn-ghost" disabled={pending} onClick={() => run(() => markNo(d.dealId), "Sperret for alltid")}><Ban className="h-4 w-4" aria-hidden="true" /> Sa nei</button>
        </div>
      )}
    </li>
  );
}

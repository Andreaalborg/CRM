import Link from "next/link";
import { db } from "@/lib/db";
import { OPEN_STAGES, dueState, type Stage } from "@/lib/crm/core";
import { createTask } from "@/lib/crm/actions";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge, DueBadge } from "@/components/crm/StatusBadge";
import { TaskButtons, NextStepDoneButton } from "@/components/crm/ActionButtons";
import { ActionForm, Field } from "@/components/crm/Forms";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OppgaverPage() {
  const [tasks, nextSteps, companies] = await Promise.all([
    db.crmTask.findMany({ where: { ferdig: null }, orderBy: { forfall: "asc" }, include: { company: { select: { id: true, navn: true } } } }),
    db.deal.findMany({ where: { nesteStegDato: { not: null }, stage: { in: [...OPEN_STAGES, "PAUSE"] } }, orderBy: { nesteStegDato: "asc" }, include: { company: { select: { id: true, navn: true } } } }),
    db.company.findMany({ select: { id: true, navn: true }, orderBy: { navn: "asc" } }),
  ]);
  return (
    <div>
      <PageHeader title="Oppgaver og oppfølging" description="Åpne oppgaver og neste steg på deals, sortert etter dato." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6 min-w-0">
          <section className="crm-card p-4 sm:p-6" aria-labelledby="h-neste">
            <h2 id="h-neste" className="mb-3 font-semibold">Neste steg på deals ({nextSteps.length})</h2>
            <ul className="space-y-3">
              {nextSteps.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border p-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2"><Link href={`/dashboard/crm/firma/${d.company.id}`} className="font-semibold text-brand hover:underline">{d.company.navn}</Link><StatusBadge stage={d.stage as Stage} /><DueBadge state={dueState(d.nesteStegDato)} /></p>
                    <p className="text-sm break-words">{d.nesteSteg ?? "–"} · <span className="text-brand-muted">{d.nesteStegDato && formatDate(d.nesteStegDato)}</span></p>
                  </div>
                  <NextStepDoneButton dealId={d.id} />
                </li>
              ))}
              {!nextSteps.length && <li className="text-sm text-brand-muted">Ingen planlagte steg.</li>}
            </ul>
          </section>
          <section className="crm-card p-4 sm:p-6" aria-labelledby="h-opp">
            <h2 id="h-opp" className="mb-3 font-semibold">Oppgaver ({tasks.length})</h2>
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.id} className="rounded-xl border border-brand-border p-3">
                  <p className="flex flex-wrap items-center gap-2 font-medium">{t.tittel} <DueBadge state={dueState(t.forfall)} /></p>
                  <p className="mb-2 text-sm text-brand-muted">{formatDate(t.forfall)}{t.company && <> · <Link href={`/dashboard/crm/firma/${t.company.id}`} className="text-brand hover:underline">{t.company.navn}</Link></>}</p>
                  <TaskButtons id={t.id} done={false} />
                </li>
              ))}
              {!tasks.length && <li className="text-sm text-brand-muted">Ingen åpne oppgaver.</li>}
            </ul>
          </section>
        </div>
        <section className="crm-card p-4 sm:p-6 h-fit" aria-labelledby="h-ny">
          <h2 id="h-ny" className="mb-3 font-semibold">Ny oppgave</h2>
          <ActionForm action={createTask} submitLabel="Legg til" resetOnSuccess className="space-y-3">
            <Field name="tittel" label="Oppgave" required />
            <Field name="forfall" label="Forfall" type="date" required />
            <div>
              <label htmlFor="f-companyId" className="crm-label">Firma (valgfritt)</label>
              <select id="f-companyId" name="companyId" className="crm-input" defaultValue="">
                <option value="">Ingen</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.navn}</option>)}
              </select>
            </div>
          </ActionForm>
        </section>
      </div>
    </div>
  );
}

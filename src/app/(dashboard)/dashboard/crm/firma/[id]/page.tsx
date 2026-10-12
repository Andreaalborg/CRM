import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { createContact, createDeal, updateCompany, updateDealNext, addActivity, createTask } from "@/lib/crm/actions";
import { STAGE_LABEL, expectedValue, formatNok, dueState, type Stage } from "@/lib/crm/core";
import { CollapsibleSection } from "@/components/crm/CollapsibleSection";
import { StatusBadge, DueBadge } from "@/components/crm/StatusBadge";
import { ActionForm, CompanyFields, Field, Choice, Area, Expander, KILDER, PAKKER, STEG } from "@/components/crm/Forms";
import { NextStepDoneButton, TaskButtons, DeleteCompanyButton } from "@/components/crm/ActionButtons";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const AKT_LABEL: Record<string, string> = { NOTAT: "Notat", EPOST: "E-post", TELEFON: "Telefon", MOTE: "Møte", STEG: "Steg", SYSTEM: "System" };
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export default async function FirmaDetalj({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await db.company.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      deals: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { createdAt: "desc" }, take: 100, include: { deal: { select: { tittel: true } } } },
      tasks: { orderBy: [{ ferdig: "asc" }, { forfall: "asc" }] },
    },
  });
  if (!c) notFound();
  const users = await db.user.findMany({ where: { id: { in: c.activities.map((a) => a.userId).filter(Boolean) as string[] } }, select: { id: true, name: true, email: true } });
  const userName = (uid: string | null) => { const u = users.find((x) => x.id === uid); return u?.name || u?.email || "Ukjent"; };
  const main = c.deals[0];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/crm/firma" className="text-sm text-brand hover:underline">← Til firmalisten</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="break-words">{c.navn}</h1>
          {main && <StatusBadge stage={main.stage as Stage} />}
        </div>
        <p className="mt-1 text-sm text-brand-muted break-words">
          {[c.orgnr && `Orgnr ${c.orgnr}`, c.orgform, c.bransje, c.kommune].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* Sammendrag */}
      <section aria-label="Sammendrag" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="crm-card p-4"><p className="text-sm text-brand-muted">Verdi</p><p className="font-bold">{formatNok(main?.verdi)}</p>
          {main && <p className="text-sm text-brand-muted">{main.sannsynlighet} % · forventet {formatNok(expectedValue(main.sannsynlighet, main.verdi))}</p>}</div>
        <div className="crm-card p-4"><p className="text-sm text-brand-muted">Neste steg</p>
          <p className="font-semibold break-words">{main?.nesteSteg ?? "–"}</p>
          {main?.nesteStegDato && <p className="flex items-center gap-2 text-sm text-brand-muted">{formatDate(main.nesteStegDato)} <DueBadge state={dueState(main.nesteStegDato)} /></p>}</div>
        <div className="crm-card p-4 min-w-0"><p className="text-sm text-brand-muted">Kontakt</p>
          {c.generiskEpost && <a href={`mailto:${c.generiskEpost}`} className="block truncate text-brand hover:underline">{c.generiskEpost}</a>}
          {c.telefon && <a href={`tel:${c.telefon}`} className="block text-brand hover:underline">{c.telefon}</a>}
          {c.nettside && <a href={c.nettside} target="_blank" rel="noreferrer" className="block truncate text-brand hover:underline">{c.nettside.replace(/^https?:\/\//, "")}</a>}
          {c.contacts[0] ? <p className="truncate text-sm">{c.contacts[0].navn}{c.contacts[0].rolle && `, ${c.contacts[0].rolle}`}</p>
            : !c.generiskEpost && !c.telefon && !c.nettside && <><p className="text-sm text-brand-muted">Ingen kontaktperson ennå</p><a href="#kontakter" className="text-sm font-medium text-brand hover:underline">+ Legg til kontakt</a></>}</div>
        <div className="crm-card p-4 min-w-0"><p className="text-sm text-brand-muted">Demo</p>
          {c.demoUrl ? <a href={c.demoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 break-all text-brand hover:underline">Åpne demo <ExternalLink className="h-3 w-3" aria-hidden="true" /><span className="sr-only">(åpnes i ny fane)</span></a> : <p>–</p>}</div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6 min-w-0">
          <CollapsibleSection id="deals" title={`Deals (${c.deals.length})`} defaultOpenMobile summary={main ? `${main.tittel} – ${STAGE_LABEL[main.stage as Stage]}` : "Ingen deals"}>
            <ul className="space-y-4">
              {c.deals.map((d) => (
                <li key={d.id} className="rounded-xl border border-brand-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{d.tittel}</span><StatusBadge stage={d.stage as Stage} />
                    <span className="text-sm text-brand-muted">{formatNok(d.verdi)} · {d.sannsynlighet} %{d.pakke ? ` · ${d.pakke}` : ""}{d.maanedspris ? ` · ${formatNok(d.maanedspris)}/mnd` : ""}</span>
                  </div>
                  {d.tapsarsak && <p className="text-sm">Tapsårsak: {d.tapsarsak}</p>}
                  {d.nesteSteg && <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span>Neste: {d.nesteSteg}</span><NextStepDoneButton dealId={d.id} label="Neste steg gjort" /></div>}
                  <details className="mt-2">
                    <summary className="crm-focus cursor-pointer text-sm font-medium text-brand">Endre neste steg, verdi og pakke</summary>
                    <ActionForm action={updateDealNext.bind(null, d.id)} submitLabel="Lagre" successText="Lagret" className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Field name="nesteSteg" label="Neste steg" defaultValue={d.nesteSteg} />
                      <Field name="nesteStegDato" label="Dato" type="date" defaultValue={iso(d.nesteStegDato)} />
                      <Field name="verdi" label="Verdi (NOK)" type="number" min={0} defaultValue={d.verdi} />
                      <Field name="sannsynlighet" label="Sannsynlighet %" type="number" min={0} max={100} defaultValue={d.sannsynlighet} />
                      <Choice name="pakke" label="Pakke" options={PAKKER} defaultValue={d.pakke} empty="Ikke valgt" />
                      <Field name="maanedspris" label="Månedspris (NOK)" type="number" min={0} defaultValue={d.maanedspris} />
                    </ActionForm>
                  </details>
                </li>
              ))}
            </ul>
            <details className="mt-4">
              <summary className="crm-focus cursor-pointer text-sm font-medium text-brand">+ Ny deal</summary>
              <ActionForm action={createDeal.bind(null, c.id)} submitLabel="Opprett deal" resetOnSuccess className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field name="tittel" label="Tittel" required />
                <Choice name="stage" label="Steg" options={STEG} defaultValue="KVALIFISERT" />
                <Field name="verdi" label="Verdi (NOK)" type="number" min={0} />
                <Choice name="kilde" label="Kilde" options={KILDER} defaultValue="ANNET" />
                <Choice name="pakke" label="Pakke" options={PAKKER} empty="Ikke valgt" />
                <Field name="maanedspris" label="Månedspris (NOK)" type="number" min={0} />
                <Field name="nesteSteg" label="Neste steg" />
                <Field name="nesteStegDato" label="Neste steg-dato" type="date" />
              </ActionForm>
            </details>
          </CollapsibleSection>

          <CollapsibleSection id="salg" title="Svakheter og salgsvinkel" summary={c.salgsvinkel ?? "Ikke fylt ut"}>
            <h3 className="text-sm font-semibold">Svakheter</h3>
            {c.svakheter ? <ul className="mb-3 list-disc pl-5 text-sm">{c.svakheter.split("\n").filter(Boolean).map((s, i) => <li key={i}>{s}</li>)}</ul> : <p className="mb-3 text-sm text-brand-muted">Ingen registrert.</p>}
            <h3 className="text-sm font-semibold">Salgsvinkel</h3>
            <p className="text-sm whitespace-pre-wrap">{c.salgsvinkel ?? "–"}</p>
          </CollapsibleSection>

          <CollapsibleSection id="logg" title={`Aktivitetslogg (${c.activities.length})`} defaultOpenMobile summary={c.activities[0]?.tekst}>
            <ActionForm action={addActivity.bind(null, c.id)} submitLabel="Legg til" resetOnSuccess className="mb-4 grid gap-3 sm:grid-cols-[10rem_1fr]">
              <Choice name="type" label="Type" options={[["NOTAT", "Notat"], ["TELEFON", "Telefon"], ["EPOST", "E-post"], ["MOTE", "Møte"]]} defaultValue="NOTAT" />
              {main && <input type="hidden" name="dealId" value={main.id} />}
              <Area name="tekst" label="Hva skjedde?" rows={2} />
            </ActionForm>
            <ol className="space-y-3 border-l-2 border-brand-border pl-4">
              {c.activities.map((a) => (
                <li key={a.id}>
                  <p className="text-sm text-brand-muted"><span className="font-semibold text-brand-ink">{AKT_LABEL[a.type]}</span> · {formatDateTime(a.createdAt)} · {userName(a.userId)}{a.kilde && a.kilde !== "manuell" ? ` (${a.kilde})` : ""}{a.deal ? ` · ${a.deal.tittel}` : ""}</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{a.tekst}</p>
                </li>
              ))}
            </ol>
          </CollapsibleSection>
        </div>

        <div className="space-y-6 min-w-0">
          <CollapsibleSection id="oppgaver" title={`Oppgaver (${c.tasks.filter((t) => !t.ferdig).length})`}>
            <ul className="mb-4 space-y-3">
              {c.tasks.map((t) => (
                <li key={t.id} className="rounded-xl border border-brand-border p-3">
                  <p className={t.ferdig ? "text-sm line-through text-brand-muted" : "text-sm font-medium"}>{t.tittel}</p>
                  <p className="mb-2 flex items-center gap-2 text-sm text-brand-muted">{formatDate(t.forfall)} {!t.ferdig && <DueBadge state={dueState(t.forfall)} />}</p>
                  <TaskButtons id={t.id} done={!!t.ferdig} />
                </li>
              ))}
            </ul>
            {c.tasks.length === 0 && <p className="mb-3 text-sm text-brand-muted">Ingen oppgaver ennå.</p>}
            <Expander label="Ny oppgave">
              <ActionForm action={createTask} submitLabel="Legg til oppgave" resetOnSuccess className="space-y-3">
                <input type="hidden" name="companyId" value={c.id} />
                {main && <input type="hidden" name="dealId" value={main.id} />}
                <Field name="tittel" label="Oppgave" required />
                <Field name="forfall" label="Forfall" type="date" required />
              </ActionForm>
            </Expander>
          </CollapsibleSection>

          <CollapsibleSection id="kontakter" title={`Kontakter (${c.contacts.length})`} summary={c.contacts.map((k) => k.navn).join(", ") || "Ingen"}>
            <ul className="mb-4 space-y-2 text-sm">
              {c.contacts.map((k) => (
                <li key={k.id} className="min-w-0"><span className="font-medium">{k.navn}</span>{k.rolle && `, ${k.rolle}`}
                  {k.epost && <a className="block truncate text-brand hover:underline" href={`mailto:${k.epost}`}>{k.epost}</a>}
                  {k.telefon && <a className="block text-brand hover:underline" href={`tel:${k.telefon}`}>{k.telefon}</a>}</li>
              ))}
            </ul>
            <details>
              <summary className="crm-focus cursor-pointer text-sm font-medium text-brand">+ Ny kontakt</summary>
              <ActionForm action={createContact.bind(null, c.id)} submitLabel="Lagre kontakt" resetOnSuccess className="mt-3 space-y-3">
                <Field name="navn" label="Navn" required />
                <Field name="rolle" label="Rolle" />
                <Field name="epost" label="E-post" type="email" />
                <Field name="telefon" label="Telefon" type="tel" />
              </ActionForm>
            </details>
          </CollapsibleSection>

          <CollapsibleSection id="rediger" title="Rediger firma">
            <ActionForm action={updateCompany.bind(null, c.id)} submitLabel="Lagre firma" successText="Lagret">
              <CompanyFields c={c as unknown as Record<string, string | number | null>} />
            </ActionForm>
            <div className="mt-6 border-t border-brand-border pt-4"><DeleteCompanyButton id={c.id} navn={c.navn} /></div>
          </CollapsibleSection>
        </div>
      </div>
    </div>
  );
}

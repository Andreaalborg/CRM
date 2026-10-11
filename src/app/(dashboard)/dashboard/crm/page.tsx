import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { OPEN_STAGES, osloDayBounds, dueState, expectedValue, formatNok, type Stage } from "@/lib/crm/core";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge, DueBadge } from "@/components/crm/StatusBadge";
import { NextStepDoneButton, TaskButtons, ApproveButton } from "@/components/crm/ActionButtons";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IDagPage() {
  const now = new Date();
  const { end } = osloDayBounds(now);
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [dueDeals, dueTasks, newLeads, openDeals, wonMonth, toApprove] = await Promise.all([
    db.deal.findMany({
      where: { nesteStegDato: { lt: end }, stage: { in: [...OPEN_STAGES, "PAUSE"] } },
      orderBy: { nesteStegDato: "asc" },
      include: { company: { select: { id: true, navn: true } } },
    }),
    db.crmTask.findMany({
      where: { forfall: { lt: end }, ferdig: null },
      orderBy: { forfall: "asc" },
      include: { company: { select: { id: true, navn: true } } },
    }),
    db.deal.findMany({
      where: { createdAt: { gte: weekAgo }, stage: { in: ["INNKOMMENDE", "KVALIFISERT"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { company: { select: { id: true, navn: true } } },
    }),
    db.deal.findMany({ where: { stage: { in: OPEN_STAGES } }, select: { stage: true, verdi: true, sannsynlighet: true } }),
    db.deal.count({ where: { stage: "VUNNET", signertDato: { gte: monthStart } } }),
    db.deal.findMany({
      where: { stage: "KVALIFISERT" },
      orderBy: [{ sannsynlighet: "desc" }, { createdAt: "asc" }],
      take: 20,
      include: { company: { select: { id: true, navn: true, generiskEpost: true, rodtFlagg: true } } },
    }),
  ]);

  const inDialog = openDeals.filter((d) => ["KONTAKTET", "SVART", "MOTE"].includes(d.stage)).length;
  const offers = openDeals.filter((d) => d.stage === "TILBUD");
  const pipelineValue = openDeals.reduce((s, d) => s + expectedValue(d.sannsynlighet, d.verdi), 0);

  const stats = [
    { label: "Nye leads (7 d)", value: String(newLeads.length) },
    { label: "I dialog", value: String(inDialog) },
    { label: "Tilbud ute", value: `${offers.length}`, sub: formatNok(offers.reduce((s, d) => s + (d.verdi ?? 0), 0)) },
    { label: "Vunnet denne mnd", value: String(wonMonth) },
    { label: "Forventet pipelineverdi", value: formatNok(pipelineValue) },
  ];

  return (
    <div>
      <PageHeader
        title="I dag"
        description={new Intl.DateTimeFormat("nb-NO", { dateStyle: "full", timeZone: "Europe/Oslo" }).format(now)}
        action={<Link href="/dashboard/crm/firma/ny" className="crm-btn"><Plus className="h-4 w-4" aria-hidden="true" /> Ny lead</Link>}
      />

      <section aria-label="Nøkkeltall" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="crm-card p-4">
            <p className="text-sm text-brand-muted">{s.label}</p>
            <p className="mt-1 text-xl font-bold text-brand-ink">{s.value}</p>
            {s.sub && <p className="text-xs text-brand-muted">{s.sub}</p>}
          </div>
        ))}
      </section>

      {toApprove.length > 0 && (
        <section className="crm-card mb-6 p-4 sm:p-6" aria-labelledby="godkj">
          <h2 id="godkj" className="mb-1 font-semibold">Til godkjenning ({toApprove.length})</h2>
          <p className="mb-4 text-sm text-brand-muted">Kvalifiserte leads (fra lead-appen og boter). Ett klikk godkjenner for kontakt. Ingenting sendes automatisk.</p>
          <ul className="divide-y divide-brand-border">
            {toApprove.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/crm/firma/${d.company.id}`} className="font-semibold text-brand hover:underline">{d.company.navn}</Link>
                  <p className="text-sm text-brand-muted break-words">{d.sannsynlighet} % · {formatNok(d.verdi)}{d.company.generiskEpost ? ` · ${d.company.generiskEpost}` : ""}{d.company.rodtFlagg ? ` · ⚑ ${d.company.rodtFlagg}` : ""}</p>
                </div>
                <ApproveButton dealId={d.id} navn={d.company.navn} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="crm-card p-4 sm:p-6" aria-labelledby="oppf">
          <h2 id="oppf" className="mb-4 font-semibold">Oppfølginger i dag og forfalte ({dueDeals.length + dueTasks.length})</h2>
          {dueDeals.length + dueTasks.length === 0 && <p className="text-sm text-brand-muted">Ingenting forfaller i dag. 🎉</p>}
          <ul className="space-y-3">
            {dueDeals.map((d) => (
              <li key={d.id} className="rounded-xl border border-brand-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/dashboard/crm/firma/${d.company.id}`} className="font-semibold text-brand underline-offset-2 hover:underline">{d.company.navn}</Link>
                  <StatusBadge stage={d.stage as Stage} />
                  <DueBadge state={dueState(d.nesteStegDato, now)} />
                </div>
                <p className="mt-1 text-sm">{d.nesteSteg ?? "Neste steg ikke beskrevet"}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-brand-muted">{d.tittel} · {d.nesteStegDato && formatDate(d.nesteStegDato)}</span>
                  <NextStepDoneButton dealId={d.id} />
                </div>
              </li>
            ))}
            {dueTasks.map((t) => (
              <li key={t.id} className="rounded-xl border border-brand-border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{t.tittel}</span>
                  <DueBadge state={dueState(t.forfall, now)} />
                </div>
                {t.company && <Link href={`/dashboard/crm/firma/${t.company.id}`} className="text-sm text-brand hover:underline">{t.company.navn}</Link>}
                <div className="mt-2"><TaskButtons id={t.id} done={false} /></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="crm-card p-4 sm:p-6" aria-labelledby="nye">
          <h2 id="nye" className="mb-4 font-semibold">Nye leads siste 7 dager</h2>
          {newLeads.length === 0 && <p className="text-sm text-brand-muted">Ingen nye leads.</p>}
          <ul className="divide-y divide-brand-border">
            {newLeads.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <Link href={`/dashboard/crm/firma/${d.company.id}`} className="font-medium text-brand hover:underline">{d.company.navn}</Link>
                <span className="text-sm text-brand-muted">{formatNok(d.verdi)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

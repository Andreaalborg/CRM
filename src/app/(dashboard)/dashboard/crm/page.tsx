import Link from "next/link";
import { Plus, Phone, Mail } from "lucide-react";
import { db } from "@/lib/db";
import { OPEN_STAGES, osloDayBounds, dueState, expectedValue, formatNok, type Stage } from "@/lib/crm/core";
import { PageHeader } from "@/components/crm/PageHeader";
import { StatusBadge, DueBadge } from "@/components/crm/StatusBadge";
import { NextStepDoneButton, PostponeNextStepButton, TaskButtons, ApproveButton } from "@/components/crm/ActionButtons";
import { formatDate } from "@/lib/utils";
import { OutreachQueue, type QueueItem } from "@/components/crm/OutreachQueue";
import { emailHealth } from "@/lib/crm/mailer";
import { draftBlockers, unsubUrls } from "@/lib/crm/outreach-actions";
import { footer, STEG_LABEL } from "@/lib/crm/outreach-core";

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
      include: { company: { select: { id: true, navn: true, contacts: { select: { navn: true, telefon: true, epost: true }, orderBy: { createdAt: "asc" }, take: 1 } } } },
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

  const [drafts, health] = await Promise.all([
    db.outreachDraft.findMany({
      where: { status: "UTKAST", planlagtFor: { lt: end } },
      orderBy: [{ planlagtFor: "asc" }],
      include: { company: { select: { navn: true } }, deal: { select: { kilde: true } } },
    }),
    emailHealth(),
  ]);
  const queue: QueueItem[] = await Promise.all(drafts.map(async (d) => ({
    id: d.id, dealId: d.dealId, companyId: d.companyId, firma: d.company.navn, til: d.til, steg: STEG_LABEL[d.steg] ?? `Steg ${d.steg}`,
    emne: d.emne, tekst: d.tekst, planlagt: d.planlagtFor.toISOString(),
    footer: footer((await unsubUrls(d.token)).page, d.deal.kilde === "NETTSIDE" ? "virksomheten på deres egen nettside" : "virksomheten i Enhetsregisteret (Brønnøysund) og på deres egen nettside"),
    blockers: await draftBlockers(d.id),
  })));

  const { start: dayStart } = osloDayBounds(now);
  const daysLate = (d: Date | null) => (d && d < dayStart ? Math.max(1, Math.ceil((dayStart.getTime() - d.getTime()) / 86400_000)) : 0);
  type Item = { kind: "deal"; d: (typeof dueDeals)[number]; at: number; overdue: boolean; days: number } | { kind: "task"; t: (typeof dueTasks)[number]; at: number; overdue: boolean; days: number };
  const items: Item[] = [
    ...dueDeals.map((d) => ({ kind: "deal" as const, d, at: d.nesteStegDato?.getTime() ?? 0, overdue: daysLate(d.nesteStegDato) > 0, days: daysLate(d.nesteStegDato) })),
    ...dueTasks.map((t) => ({ kind: "task" as const, t, at: t.forfall.getTime(), overdue: daysLate(t.forfall) > 0, days: daysLate(t.forfall) })),
  ].sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.at - b.at);

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

      <section className="crm-card mb-6 p-4 sm:p-6" aria-labelledby="oppf">
        <h2 id="oppf" className="mb-4">Oppfølginger i dag og forfalte ({items.length})</h2>
        {items.length === 0 && (
          <p className="text-sm text-brand-muted">Ingenting forfaller i dag 🎉 · <Link href="/dashboard/crm/pipeline" className="font-medium text-brand underline-offset-2 hover:underline">Se pipeline</Link></p>
        )}
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((it) => it.kind === "deal" ? (() => { const d = it.d; const k = d.company.contacts[0]; return (
            <li key={d.id} className={`rounded-xl border p-3 ${it.overdue ? "border-red-200 bg-red-50/40" : "border-brand-border"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/crm/firma/${d.company.id}`} className="font-semibold text-brand underline-offset-2 hover:underline">{d.company.navn}</Link>
                <StatusBadge stage={d.stage as Stage} />
                <DueBadge state={dueState(d.nesteStegDato, now)} days={it.days} />
              </div>
              <p className="mt-1">{d.nesteSteg ?? "Neste steg ikke beskrevet"}</p>
              <p className="text-sm text-brand-muted">{d.tittel}{d.nesteStegDato && ` · ${formatDate(d.nesteStegDato)}`}{k && ` · ${k.navn}`}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {k?.telefon && <a href={`tel:${k.telefon.replace(/\s+/g, "")}`} className="crm-btn"><Phone className="h-4 w-4" aria-hidden="true" /> Ring {k.telefon}</a>}
                {!k?.telefon && k?.epost && <a href={`mailto:${k.epost}`} className="crm-btn"><Mail className="h-4 w-4" aria-hidden="true" /> E-post</a>}
                <NextStepDoneButton dealId={d.id} />
                <PostponeNextStepButton dealId={d.id} />
              </div>
            </li>
          ); })() : (() => { const t = it.t; return (
            <li key={t.id} className={`rounded-xl border p-3 ${it.overdue ? "border-red-200 bg-red-50/40" : "border-brand-border"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{t.tittel}</span>
                <DueBadge state={dueState(t.forfall, now)} days={it.days} />
              </div>
              {t.company && <Link href={`/dashboard/crm/firma/${t.company.id}`} className="text-sm text-brand hover:underline">{t.company.navn}</Link>}
              <div className="mt-2"><TaskButtons id={t.id} done={false} /></div>
            </li>
          ); })())}
        </ul>
      </section>

      <section aria-label="Nøkkeltall" className="-mx-4 mb-6 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="crm-card min-w-[9.5rem] shrink-0 snap-start px-4 py-3">
            <p className="text-sm text-brand-muted">{s.label}</p>
            <p className="mt-0.5 font-heading text-xl font-bold text-brand-ink">{s.value}</p>
            {s.sub && <p className="text-sm text-brand-muted">{s.sub}</p>}
          </div>
        ))}
      </section>

      <OutreachQueue items={queue} health={health} />

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

      <div className="grid gap-6">
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

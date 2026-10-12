import Link from "next/link";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/portal/session";
import { submissionWhere, matchesQuery, type PortalFilter } from "@/lib/portal/core";
import { SubmissionList } from "@/components/portal/SubmissionList";

export const dynamic = "force-dynamic";

export default async function Henvendelser({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const c = await requireCustomer();
  const sp = await searchParams;
  const f: PortalFilter = { q: sp.q, status: sp.status, formId: sp.form, fra: sp.fra, til: sp.til };
  const [forms, all] = await Promise.all([
    db.form.findMany({ where: { organizationId: c.orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.submission.findMany({ where: submissionWhere(c.orgId, f), orderBy: { createdAt: "desc" }, take: 500, select: { id: true, createdAt: true, data: true, readAt: true, handledAt: true, form: { select: { name: true } } } }),
  ]);
  const rows = all.filter((r) => matchesQuery(r.data, f.q));
  const qs = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, form: sp.form, fra: sp.fra, til: sp.til }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Henvendelser</h1>
        <a href={`/customer/leads/export${qs ? `?${qs}` : ""}`} className="crm-btn-ghost text-sm" download>Last ned CSV ({rows.length})</a>
      </div>
      <form method="get" className="crm-card grid grid-cols-2 gap-3 p-4 sm:grid-cols-5" aria-label="Filter">
        <div className="col-span-2"><label className="crm-label" htmlFor="q">Søk</label><input id="q" name="q" defaultValue={sp.q} className="crm-input" placeholder="Søk på navn, e-post, melding …" /></div>
        <div><label className="crm-label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className="crm-input"><option value="">Alle</option><option value="ny">Ny</option><option value="handtert">Håndtert</option></select></div>
        <div><label className="crm-label" htmlFor="form">Skjema</label>
          <select id="form" name="form" defaultValue={sp.form ?? ""} className="crm-input"><option value="">Alle</option>{forms.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
        <div><label className="crm-label" htmlFor="fra">Fra dato</label><input id="fra" name="fra" type="date" defaultValue={sp.fra} className="crm-input" /></div>
        <div className="col-span-2 sm:col-span-1 sm:col-start-5"><label className="crm-label" htmlFor="til">Til dato</label><input id="til" name="til" type="date" defaultValue={sp.til} className="crm-input" /></div>
        <div className="col-span-2 flex gap-2 sm:col-span-5"><button className="crm-btn">Filtrer</button><Link href="/customer/leads" className="crm-btn-ghost">Nullstill</Link></div>
      </form>
      <p className="text-sm text-[var(--color-brand-muted)]" aria-live="polite">{rows.length} treff</p>
      <SubmissionList rows={rows} filtered={!!qs} />
    </div>
  );
}

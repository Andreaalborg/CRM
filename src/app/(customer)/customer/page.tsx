import Link from "next/link";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/portal/session";
import { submissionWhere } from "@/lib/portal/core";
import { SubmissionList } from "@/components/portal/SubmissionList";

export const dynamic = "force-dynamic";

export default async function Oversikt() {
  const c = await requireCustomer();
  const since = new Date(Date.now() - 29 * 86400_000); since.setHours(0, 0, 0, 0);
  const [nye, uleste, siste, last30] = await Promise.all([
    db.submission.count({ where: submissionWhere(c.orgId, { status: "ny" }) }),
    db.submission.count({ where: { ...submissionWhere(c.orgId), readAt: null } }),
    db.submission.findMany({ where: submissionWhere(c.orgId), orderBy: { createdAt: "desc" }, take: 5, select: { id: true, createdAt: true, data: true, readAt: true, handledAt: true, form: { select: { name: true } } } }),
    db.submission.findMany({ where: { ...submissionWhere(c.orgId), createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);
  const key = (d: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo" }).format(d);
  const days = Array.from({ length: 30 }, (_, i) => key(new Date(since.getTime() + i * 86400_000)));
  const counts = days.map((d) => last30.filter((s) => key(s.createdAt) === d).length);
  const max = Math.max(1, ...counts);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Oversikt</h1>
      <section aria-label="Nøkkeltall" className="grid grid-cols-3 gap-3">
        {[["Nye (ikke håndtert)", nye], ["Uleste", uleste], ["Siste 30 dager", last30.length]].map(([l, v]) => (
          <div key={String(l)} className="crm-card p-3 sm:p-4"><p className="text-xs text-[var(--color-brand-muted)] sm:text-sm">{l}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>
        ))}
      </section>
      <section className="crm-card p-4" aria-labelledby="graf">
        <h2 id="graf" className="mb-3 font-semibold">Henvendelser siste 30 dager</h2>
        <div className="flex h-28 items-end gap-[2px]" role="img" aria-label={`Søylediagram: ${last30.length} henvendelser siste 30 dager, flest på én dag: ${Math.max(...counts)}`}>
          {counts.map((n, i) => <div key={days[i]} title={`${days[i]}: ${n}`} className="flex-1 rounded-t bg-[var(--color-brand)]" style={{ height: `${(n / max) * 100}%`, minHeight: n ? 4 : 1, opacity: n ? 1 : 0.25 }} />)}
        </div>
        <div className="mt-1 flex justify-between text-xs text-[var(--color-brand-muted)]"><span>{days[0]}</span><span>I dag</span></div>
      </section>
      <section aria-labelledby="siste">
        <div className="mb-2 flex items-center justify-between"><h2 id="siste" className="font-semibold">De 5 siste</h2><Link href="/customer/leads" className="text-sm font-medium text-[var(--color-brand)] underline">Se alle</Link></div>
        <SubmissionList rows={siste} />
      </section>
    </div>
  );
}

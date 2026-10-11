import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/portal/session";
import { fieldLabel, formatValue, summary } from "@/lib/portal/core";
import { StatusPill } from "@/components/portal/SubmissionList";
import { HandledToggle, NoteForm } from "@/components/portal/DetailActions";

export const dynamic = "force-dynamic";

export default async function Detalj({ params }: { params: Promise<{ id: string }> }) {
  const c = await requireCustomer();
  const { id } = await params;
  const s = await db.submission.findFirst({ where: { id, organizationId: c.orgId }, include: { form: { select: { name: true } } } });
  if (!s) notFound(); // andres innsendinger gir 404 (ikke 403) – avslører ikke at de finnes
  if (!s.readAt) await db.submission.update({ where: { id }, data: { readAt: new Date() } });
  const d = (s.data ?? {}) as Record<string, unknown>;
  const sum = summary(d);
  const fmt = new Intl.DateTimeFormat("nb-NO", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Oslo" }).format(s.createdAt);
  return (
    <div className="space-y-4">
      <Link href="/customer/leads" className="text-sm font-medium text-[var(--color-brand)] underline">← Alle henvendelser</Link>
      <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold break-words">{sum.navn}</h1><StatusPill handled={!!s.handledAt} /></div>
      <p className="text-sm text-[var(--color-brand-muted)]">{s.form.name} · {fmt}</p>
      <div className="flex flex-wrap gap-2">
        {sum.telefon && <a className="crm-btn" href={`tel:${sum.telefon.replace(/\s/g, "")}`}>Ring {sum.telefon}</a>}
        {sum.epost && <a className="crm-btn-ghost" href={`mailto:${sum.epost}`}>Send e-post</a>}
        <HandledToggle id={s.id} handled={!!s.handledAt} />
      </div>
      <section className="crm-card p-4" aria-labelledby="felt">
        <h2 id="felt" className="mb-3 font-semibold">Innsendt informasjon</h2>
        <dl className="divide-y divide-[var(--color-brand-border)]">
          {Object.entries(d).map(([k, v]) => (
            <div key={k} className="grid gap-1 py-2 sm:grid-cols-3"><dt className="text-sm font-medium text-[var(--color-brand-muted)]">{fieldLabel(k)}</dt><dd className="whitespace-pre-wrap break-words sm:col-span-2">{formatValue(v)}</dd></div>
          ))}
        </dl>
      </section>
      <section className="crm-card p-4" aria-labelledby="notat"><h2 id="notat" className="mb-2 font-semibold">Notat</h2><NoteForm id={s.id} notes={s.notes ?? ""} /></section>
    </div>
  );
}

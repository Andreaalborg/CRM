import Link from "next/link";
import { summary } from "@/lib/portal/core";

export type Row = { id: string; createdAt: Date; data: unknown; form: { name: string }; readAt: Date | null; handledAt: Date | null };
const fmt = (d: Date) => new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Oslo" }).format(d);

export function StatusPill({ handled }: { handled: boolean }) {
  return handled
    ? <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-700/20">Håndtert</span>
    : <span className="inline-flex rounded-full bg-[var(--color-brand-tint)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand)] ring-1 ring-inset ring-[var(--color-brand)]/20">Ny</span>;
}

export function SubmissionList({ rows, filtered = false }: { rows: Row[]; filtered?: boolean }) {
  if (!rows.length && filtered) return <p className="crm-card p-4 text-sm text-[var(--color-brand-muted)]">Ingen treff. Prøv et annet søk eller nullstill filtrene.</p>;
  if (!rows.length) return (
    <div className="crm-card px-4 py-8 text-center">
      <p className="text-3xl" aria-hidden="true">📭</p>
      <p className="mt-2 font-semibold">Ingen henvendelser ennå</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--color-brand-muted)]">Når noen fyller ut et skjema på nettsiden din, dukker det opp her.</p>
    </div>
  );
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const s = summary(r.data); const unread = !r.readAt;
        return (
          <li key={r.id}>
            <Link href={`/customer/leads/${r.id}`} className={`crm-card crm-focus flex items-start gap-3 p-4 hover:border-[var(--color-brand)] ${unread ? "border-l-4 border-l-[var(--color-brand)]" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className={`truncate ${unread ? "font-bold" : "font-medium"}`}>{unread && <span className="sr-only">Ulest: </span>}{s.navn}</p>
                <p className="truncate text-sm text-[var(--color-brand-muted)]">{[s.epost, s.telefon].filter(Boolean).join(" · ") || "Ingen kontaktinfo"}</p>
                <p className="mt-1 text-xs text-[var(--color-brand-muted)]">{r.form.name} · {fmt(r.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill handled={!!r.handledAt} />
                {unread && <span className="text-xs font-semibold text-[var(--color-brand)]" aria-hidden="true">Ulest</span>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

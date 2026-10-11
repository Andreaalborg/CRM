import Link from "next/link";
import { summary } from "@/lib/portal/core";

export type Row = { id: string; createdAt: Date; data: unknown; form: { name: string }; readAt: Date | null; handledAt: Date | null };
const fmt = (d: Date) => new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Oslo" }).format(d);

export function StatusPill({ handled }: { handled: boolean }) {
  return handled
    ? <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-700/20">Håndtert</span>
    : <span className="inline-flex rounded-full bg-[var(--color-brand-tint)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-brand)] ring-1 ring-inset ring-[var(--color-brand)]/20">Ny</span>;
}

export function SubmissionList({ rows }: { rows: Row[] }) {
  if (!rows.length) return <p className="crm-card p-4 text-sm text-[var(--color-brand-muted)]">Ingen henvendelser her ennå.</p>;
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

import Link from "next/link";
import { summary, portalStatus, replyMailto, PORTAL_STATUS, type PortalStatusKey } from "@/lib/portal/core";
import { ReplyButton } from "./DetailActions";

export type Row = { id: string; createdAt: Date; data: unknown; form: { name: string }; readAt: Date | null; handledAt: Date | null; contactedAt?: Date | null };
const fmt = (d: Date) => new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Oslo" }).format(d);

const PILL: Record<PortalStatusKey, string> = {
  ny: "bg-[var(--color-brand-tint)] text-[var(--color-brand)] ring-[var(--color-brand)]/20",
  kontaktet: "bg-blue-50 text-blue-800 ring-blue-700/20",
  handtert: "bg-green-50 text-green-800 ring-green-700/20",
};
export function StatusPill({ status }: { status: PortalStatusKey }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${PILL[status]}`}>{PORTAL_STATUS[status]}</span>;
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
        const s = summary(r.data); const unread = !r.readAt; const st = portalStatus(r); const mail = replyMailto({ data: r.data, formName: r.form.name, createdAt: r.createdAt });
        return (
          <li key={r.id} className={`crm-card overflow-hidden hover:border-[var(--color-brand)] ${unread ? "border-l-4 border-l-[var(--color-brand)]" : ""}`}>
            <Link href={`/customer/leads/${r.id}`} className="crm-focus flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className={`truncate ${unread ? "font-bold" : "font-medium"}`}>{unread && <span className="sr-only">Ulest: </span>}{s.navn}</p>
                <p className="truncate text-sm text-[var(--color-brand-muted)]">{[s.epost, s.telefon].filter(Boolean).join(" · ") || "Ingen kontaktinfo"}</p>
                <p className="mt-1 text-sm text-[var(--color-brand-muted)]">{r.form.name} · {fmt(r.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill status={st} />
                {unread && <span className="text-xs font-semibold text-[var(--color-brand)]" aria-hidden="true">Ulest</span>}
              </div>
            </Link>
            {mail && st !== "handtert" && <div className="-mt-2 px-4 pb-3"><ReplyButton id={r.id} href={mail} contacted={st !== "ny"} compact navn={s.navn} /></div>}
          </li>
        );
      })}
    </ul>
  );
}

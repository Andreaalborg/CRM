"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STAGES, STAGE_LABEL, formatNok, type Stage } from "@/lib/crm/core";
import { bulkMoveDeals } from "@/lib/crm/actions";
import { Sokefelt, sokeOrd, matcher } from "./Sokefelt";
import { StatusBadge } from "./StatusBadge";

export type CompanyRow = {
  id: string; navn: string; orgnr: string | null; bransje: string | null; kommune: string | null;
  dealId: string | null; stage: Stage | null; verdi: number | null; nesteStegDato: string | null; kontakter: number;
};

export function CompanyList({ rows }: { rows: CompanyRow[] }) {
  const router = useRouter();
  const [sok, setSok] = useState("");
  const [steg, setSteg] = useState("");
  const [valgt, setValgt] = useState<Set<string>>(new Set());
  const [masseSteg, setMasseSteg] = useState<Stage>("GODKJENT");
  const [melding, setMelding] = useState("");
  const [pending, start] = useTransition();

  const ord = sokeOrd(sok);
  const filtrert = useMemo(
    () => rows.filter((r) => (!steg || r.stage === steg) && matcher(`${r.navn} ${r.orgnr ?? ""} ${r.bransje ?? ""} ${r.kommune ?? ""}`, ord)),
    [rows, steg, ord]
  );

  const toggle = (id: string) => setValgt((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const alleValgt = filtrert.length > 0 && filtrert.every((r) => valgt.has(r.id));

  function masseFlytt() {
    const dealIds = rows.filter((r) => valgt.has(r.id) && r.dealId).map((r) => r.dealId!);
    start(async () => {
      const r = await bulkMoveDeals(dealIds, masseSteg);
      setMelding(`${r.moved} flyttet til ${STAGE_LABEL[masseSteg]}${r.errors.length ? `. ${r.errors.length} feilet: ${[...new Set(r.errors)].join("; ")}` : ""}`);
      setValgt(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <Sokefelt verdi={sok} onEndre={setSok} placeholder="Søk på navn, orgnr, bransje, kommune" />
        <div>
          <label htmlFor="stegfilter" className="sr-only">Filtrer på steg</label>
          <select id="stegfilter" className="crm-input sm:w-56" value={steg} onChange={(e) => setSteg(e.target.value)}>
            <option value="">Alle steg</option>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
        </div>
      </div>

      {valgt.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-border bg-brand-tint p-3">
          <span className="text-sm font-medium">{valgt.size} valgt</span>
          <label htmlFor="massesteg" className="sr-only">Sett steg</label>
          <select id="massesteg" className="crm-input w-auto" value={masseSteg} onChange={(e) => setMasseSteg(e.target.value as Stage)}>
            {STAGES.filter((s) => s !== "TAPT" && s !== "PAUSE").map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
          <button type="button" className="crm-btn" disabled={pending} onClick={masseFlytt}>Sett steg</button>
          <button type="button" className="crm-btn-ghost" onClick={() => setValgt(new Set())}>Fjern valg</button>
        </div>
      )}
      <p role="status" aria-live="polite" className="mb-2 text-sm">{melding}</p>

      {/* Desktop-tabell */}
      <div className="hidden md:block crm-card overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">Firma</caption>
          <thead className="bg-brand-surface2 text-left">
            <tr>
              <th scope="col" className="w-10 p-3">
                <input type="checkbox" aria-label="Velg alle" checked={alleValgt}
                  onChange={() => setValgt(alleValgt ? new Set() : new Set(filtrert.map((r) => r.id)))} className="h-4 w-4" />
              </th>
              <th scope="col" className="p-3 font-semibold">Firma</th>
              <th scope="col" className="p-3 font-semibold">Orgnr</th>
              <th scope="col" className="p-3 font-semibold">Bransje / kommune</th>
              <th scope="col" className="p-3 font-semibold">Steg</th>
              <th scope="col" className="p-3 font-semibold text-right">Verdi</th>
              <th scope="col" className="p-3 font-semibold">Neste dato</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filtrert.map((r) => (
              <tr key={r.id} className="hover:bg-brand-bg">
                <td className="p-3"><input type="checkbox" aria-label={`Velg ${r.navn}`} checked={valgt.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4" /></td>
                <td className="p-3"><Link href={`/dashboard/crm/firma/${r.id}`} className="font-medium text-brand hover:underline">{r.navn}</Link></td>
                <td className="p-3 tabular-nums">{r.orgnr ?? "–"}</td>
                <td className="p-3 text-brand-muted">{[r.bransje, r.kommune].filter(Boolean).join(" · ") || "–"}</td>
                <td className="p-3">{r.stage ? <StatusBadge stage={r.stage} /> : "–"}</td>
                <td className="p-3 text-right tabular-nums">{formatNok(r.verdi)}</td>
                <td className="p-3">{r.nesteStegDato ? new Date(r.nesteStegDato).toLocaleDateString("nb-NO") : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtrert.length && <p className="p-4 text-sm text-brand-muted">Ingen treff.</p>}
      </div>

      {/* Mobil-kortliste */}
      <ul className="md:hidden space-y-2">
        {filtrert.map((r) => (
          <li key={r.id} className="crm-card flex gap-3 p-3">
            <input type="checkbox" aria-label={`Velg ${r.navn}`} checked={valgt.has(r.id)} onChange={() => toggle(r.id)} className="mt-1 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/dashboard/crm/firma/${r.id}`} className="break-words font-semibold text-brand hover:underline">{r.navn}</Link>
                {r.stage && <StatusBadge stage={r.stage} />}
              </div>
              <p className="text-sm text-brand-muted break-words">{[r.orgnr, r.bransje, r.kommune].filter(Boolean).join(" · ")}</p>
              <p className="text-sm">{formatNok(r.verdi)}{r.nesteStegDato && ` · neste ${new Date(r.nesteStegDato).toLocaleDateString("nb-NO")}`}</p>
            </div>
          </li>
        ))}
        {!filtrert.length && <li className="text-sm text-brand-muted">Ingen treff.</li>}
      </ul>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STAGES, STAGE_LABEL, adjacentStage, expectedValue, formatNok, dueState, type Stage } from "@/lib/crm/core";
import { moveDeal } from "@/lib/crm/actions";
import { StatusBadge, DueBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export type BoardDeal = {
  id: string; tittel: string; stage: Stage; verdi: number | null; sannsynlighet: number; kilde: string;
  nesteSteg: string | null; nesteStegDato: string | null; companyId: string; companyNavn: string; bransje: string | null;
};

const KILDE_LABEL: Record<string, string> = { LEAD_APP: "Lead-app", NETTSIDE: "Nettside", HENVISNING: "Henvisning", ANNET: "Annet" };

type Pending = { dealId: string; to: Stage } | null;

export function PipelineBoard({ deals: initial }: { deals: BoardDeal[] }) {
  const router = useRouter();
  const [deals, setDeals] = useState(initial);
  const [kilde, setKilde] = useState("");
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [needInfo, setNeedInfo] = useState<Pending>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [, start] = useTransition();
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });
  const updateEdge = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    updateEdge();
    window.addEventListener("resize", updateEdge);
    return () => window.removeEventListener("resize", updateEdge);
  }, [updateEdge]);
  function jumpTo(s: Stage) {
    const col = scroller.current?.querySelector<HTMLElement>(`[data-stage="${s}"]`);
    col?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    col?.focus({ preventScroll: true });
  }

  const visible = useMemo(() => deals.filter((d) => !kilde || d.kilde === kilde), [deals, kilde]);

  function move(dealId: string, to: Stage, extra: { tapsarsak?: string; nesteStegDato?: string } = {}) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === to) return;
    if ((to === "TAPT" && !extra.tapsarsak) || (to === "PAUSE" && !extra.nesteStegDato)) {
      setNeedInfo({ dealId, to });
      return;
    }
    const prev = deals;
    setDeals((ds) => ds.map((d) => (d.id === dealId ? { ...d, stage: to } : d)));
    setError("");
    start(async () => {
      const r = await moveDeal(dealId, to, extra);
      if (!r.ok) {
        setDeals(prev);
        setError(r.error);
        setStatus(`Kunne ikke flytte: ${r.error}`);
      } else {
        setStatus(`${deal.companyNavn} flyttet til ${STAGE_LABEL[to]}`);
        router.refresh();
        requestAnimationFrame(() => cardRefs.current[dealId]?.focus());
      }
    });
  }

  function onKey(e: React.KeyboardEvent, d: BoardDeal) {
    if (!e.altKey) return;
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const to = adjacentStage(d.stage, dir);
    if (to) move(d.id, to);
  }

  const card = (d: BoardDeal) => {
    const prev = adjacentStage(d.stage, -1);
    const next = adjacentStage(d.stage, 1);
    return (
      <article
        key={d.id}
        ref={(el) => { cardRefs.current[d.id] = el; }}
        tabIndex={0}
        draggable
        onDragStart={(e) => { setDrag(d.id); e.dataTransfer.setData("text/plain", d.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDrag(null); setOver(null); }}
        onKeyDown={(e) => onKey(e, d)}
        aria-label={`${d.companyNavn}, ${STAGE_LABEL[d.stage]}. Alt + venstre/høyre pil flytter.`}
        data-deal={d.id}
        className={cn("crm-focus rounded-xl border border-brand-border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing", drag === d.id && "opacity-50")}
      >
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/crm/firma/${d.companyId}`} className="min-w-0 break-words font-semibold text-brand hover:underline">{d.companyNavn}</Link>
          <DueBadge state={dueState(d.nesteStegDato ? new Date(d.nesteStegDato) : null)} />
        </div>
        <p className="text-sm text-brand-muted break-words">{d.tittel}</p>
        <p className="mt-1 text-sm">
          {formatNok(d.verdi)} <span className="text-brand-muted">· {d.sannsynlighet} % · forv. {formatNok(expectedValue(d.sannsynlighet, d.verdi))}</span>
        </p>
        {d.nesteSteg && (
          <p className="mt-1 text-sm break-words">
            <span className="font-medium">Neste:</span> {d.nesteSteg}
            {d.nesteStegDato && <span className="text-brand-muted"> ({new Date(d.nesteStegDato).toLocaleDateString("nb-NO")})</span>}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1">
          <button type="button" className="crm-focus flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border disabled:opacity-40"
            disabled={!prev} onClick={() => prev && move(d.id, prev)} aria-label={prev ? `Flytt ${d.companyNavn} til ${STAGE_LABEL[prev]}` : "Første steg"}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <label className="sr-only" htmlFor={`flytt-${d.id}`}>Flytt {d.companyNavn} til steg</label>
          <select id={`flytt-${d.id}`} value={d.stage} onChange={(e) => move(d.id, e.target.value as Stage)}
            className="crm-input min-h-11 flex-1 py-1 text-sm">
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </select>
          <button type="button" className="crm-focus flex h-11 w-11 items-center justify-center rounded-lg border border-brand-border disabled:opacity-40"
            disabled={!next} onClick={() => next && move(d.id, next)} aria-label={next ? `Flytt ${d.companyNavn} til ${STAGE_LABEL[next]}` : "Siste steg"}>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="kildefilter" className="crm-label">Kilde</label>
          <select id="kildefilter" value={kilde} onChange={(e) => setKilde(e.target.value)} className="crm-input w-48">
            <option value="">Alle</option>
            {Object.entries(KILDE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <p className="text-sm text-brand-muted">{visible.length} deals</p>
      </div>
      <p role="status" aria-live="polite" className="sr-only">{status}</p>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {/* Desktop: kanban med horisontal rulling inne i tavla */}
      <div className="hidden lg:block">
        <nav aria-label="Steg i pipelinen" className="mb-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
          {STAGES.map((s, i) => {
            const n = visible.filter((d) => d.stage === s).length;
            return (
              <span key={s} className="flex items-center">
                {i > 0 && <span aria-hidden="true" className="px-1 text-brand-muted">·</span>}
                <button type="button" onClick={() => jumpTo(s)}
                  className={cn("crm-focus rounded-lg px-2 py-1 hover:bg-brand-surface2", n ? "font-semibold text-brand-ink" : "text-brand-muted")}>
                  {STAGE_LABEL[s]} <span className="tabular-nums">{n}</span>
                </button>
              </span>
            );
          })}
        </nav>
        <div className="relative">
          <div ref={scroller} onScroll={updateEdge} className="snap-x snap-mandatory overflow-x-auto pb-4 scroll-pl-1">
            <div className="flex w-max gap-3">
              {STAGES.map((s) => {
                const col = visible.filter((d) => d.stage === s);
                const sum = col.reduce((a, d) => a + (d.verdi ?? 0), 0);
                return (
                  <section key={s} aria-label={STAGE_LABEL[s]} tabIndex={-1}
                    onDragOver={(e) => { e.preventDefault(); setOver(s); }}
                    onDragLeave={() => setOver((o) => (o === s ? null : o))}
                    onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain") || drag; setOver(null); if (id) move(id, s); }}
                    data-stage={s}
                    className={cn("flex w-[260px] min-w-[260px] shrink-0 snap-start flex-col rounded-2xl bg-brand-surface2 p-2 outline-none", over === s && "ring-2 ring-brand")}>
                    <header className="mb-2 flex items-center justify-between px-1">
                      <StatusBadge stage={s} />
                      <span className="text-xs text-brand-muted">{col.length} · {formatNok(sum)}</span>
                    </header>
                    <div className="flex min-h-24 flex-col gap-2">
                      {col.length ? col.map(card) : <p className="px-1 py-6 text-center text-sm text-brand-muted">Ingen deals her</p>}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
          {edge.left && <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-brand-bg to-transparent" />}
          {edge.right && (
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-end bg-gradient-to-l from-brand-bg via-brand-bg/80 to-transparent pr-1">
              <ChevronRight className="h-6 w-6 text-brand" />
            </div>
          )}
        </div>
      </div>

      {/* Mobil/nettbrett: kortliste gruppert per steg */}
      <div className="lg:hidden space-y-5">
        {STAGES.map((s) => {
          const col = visible.filter((d) => d.stage === s);
          if (!col.length) return null;
          return (
            <section key={s} aria-label={STAGE_LABEL[s]}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><StatusBadge stage={s} /> <span className="text-brand-muted">{col.length}</span></h2>
              <div className="space-y-2">{col.map(card)}</div>
            </section>
          );
        })}
        {!visible.length && <p className="text-sm text-brand-muted">Ingen deals ennå.</p>}
      </div>

      {needInfo && (
        <MoveInfoDialog
          to={needInfo.to}
          onCancel={() => setNeedInfo(null)}
          onSubmit={(extra) => { const p = needInfo; setNeedInfo(null); move(p.dealId, p.to, extra); }}
        />
      )}
    </div>
  );
}

function MoveInfoDialog({ to, onCancel, onSubmit }: { to: Stage; onCancel: () => void; onSubmit: (e: { tapsarsak?: string; nesteStegDato?: string }) => void }) {
  const [v, setV] = useState("");
  const isTapt = to === "TAPT";
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="flyttinfo" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && onCancel()}>
      <form className="w-full max-w-sm rounded-2xl bg-white p-5" onSubmit={(e) => { e.preventDefault(); if (v) onSubmit(isTapt ? { tapsarsak: v } : { nesteStegDato: v }); }}>
        <h2 id="flyttinfo" className="mb-3 font-semibold">Flytt til {STAGE_LABEL[to]}</h2>
        <label htmlFor="flyttfelt" className="crm-label">{isTapt ? "Tapsårsak" : "Ny oppfølgingsdato"}</label>
        <input id="flyttfelt" autoFocus required type={isTapt ? "text" : "date"} value={v} onChange={(e) => setV(e.target.value)} className="crm-input" />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="crm-btn-ghost" onClick={onCancel}>Avbryt</button>
          <button type="submit" className="crm-btn">Flytt</button>
        </div>
      </form>
    </div>
  );
}

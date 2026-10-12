"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { completeNextStep, postponeNextStep, completeTask, postponeTask, moveDeal, deleteCompany } from "@/lib/crm/actions";

export function NextStepDoneButton({ dealId, label = "Gjort" }: { dealId: string; label?: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="crm-btn-ghost" disabled={pending}
      onClick={() => start(async () => { await completeNextStep(dealId); router.refresh(); })}>
      <Check className="h-4 w-4" aria-hidden="true" /> {label}
    </button>
  );
}

export function PostponeNextStepButton({ dealId }: { dealId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="crm-btn-ghost" disabled={pending}
      onClick={() => start(async () => { await postponeNextStep(dealId, 1); router.refresh(); })}>
      <Clock className="h-4 w-4" aria-hidden="true" /> Utsett 1 dag
    </button>
  );
}

export function TaskButtons({ id, done }: { id: string; done: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="crm-btn-ghost" disabled={pending} aria-pressed={done}
        onClick={() => start(async () => { await completeTask(id, !done); router.refresh(); })}>
        <Check className="h-4 w-4" aria-hidden="true" /> {done ? "Angre" : "Gjort"}
      </button>
      {!done && (
        <button type="button" className="crm-btn-ghost" disabled={pending}
          onClick={() => start(async () => { await postponeTask(id, 1); router.refresh(); })}>
          <Clock className="h-4 w-4" aria-hidden="true" /> Utsett 1 dag
        </button>
      )}
    </div>
  );
}

/** Ett klikk: Kvalifisert/Innkommende → Godkjent for kontakt (logger godkjent_av = André). */
export function ApproveButton({ dealId, navn }: { dealId: string; navn: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="crm-btn" disabled={pending} aria-label={`Godkjenn ${navn} for kontakt`}
      onClick={() => start(async () => { await moveDeal(dealId, "GODKJENT"); router.refresh(); })}>
      <Check className="h-4 w-4" aria-hidden="true" /> Godkjenn
    </button>
  );
}

export function DeleteCompanyButton({ id, navn }: { id: string; navn: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button type="button" className="crm-btn-ghost text-red-800" disabled={pending}
      onClick={() => confirm(`Slette «${navn}» med kontakter, deals, logg og oppgaver? Dette kan ikke angres.`) &&
        start(async () => { const r = await deleteCompany(id); if (r.ok) router.push("/dashboard/crm/firma"); })}>
      Slett firma
    </button>
  );
}

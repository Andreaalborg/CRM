"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { completeNextStep, completeTask, postponeTask, moveDeal } from "@/lib/crm/actions";

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

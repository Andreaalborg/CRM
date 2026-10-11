// Mønster fra IMEM-portalen (StatusBadge), med pipeline-stegene. Farger valgt for ≥ 4.5:1 kontrast.
import { cn } from "@/lib/utils";
import { STAGE_LABEL, type Stage } from "@/lib/crm/core";

export const STAGE_STYLE: Record<Stage, string> = {
  KVALIFISERT: "bg-slate-100 text-slate-700 ring-slate-500/20",
  GODKJENT: "bg-brand-tint text-brand ring-brand/20",
  KONTAKTET: "bg-blue-50 text-blue-800 ring-blue-600/20",
  SVART: "bg-cyan-50 text-cyan-800 ring-cyan-600/20",
  MOTE: "bg-amber-50 text-amber-800 ring-amber-600/20",
  TILBUD: "bg-orange-50 text-orange-800 ring-orange-600/20",
  VUNNET: "bg-green-50 text-green-800 ring-green-600/20",
  TAPT: "bg-red-50 text-red-800 ring-red-600/20",
  PAUSE: "bg-gray-100 text-gray-700 ring-gray-500/20",
};

export function StatusBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span className={cn("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", STAGE_STYLE[stage], className)}>
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function DueBadge({ state }: { state: "forfalt" | "i-dag" | "senere" | "ingen" }) {
  if (state === "ingen") return null;
  const map = {
    forfalt: ["Forfalt", "bg-red-50 text-red-800 ring-red-600/20"],
    "i-dag": ["I dag", "bg-amber-50 text-amber-800 ring-amber-600/20"],
    senere: ["Senere", "bg-slate-100 text-slate-700 ring-slate-500/20"],
  } as const;
  const [label, cls] = map[state];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", cls)}>{label}</span>;
}

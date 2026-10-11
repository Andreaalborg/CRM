"use client";
// Fra IMEM-portalen (Sokefelt), lucide-ikoner.
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sokefelt({ verdi, onEndre, placeholder = "Søk…", className }: { verdi: string; onEndre: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted" />
      <input type="search" value={verdi} onChange={(e) => onEndre(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="crm-input pl-10 pr-9 [&::-webkit-search-cancel-button]:appearance-none" />
      {verdi && (
        <button type="button" onClick={() => onEndre("")} aria-label="Tøm søk" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted hover:bg-brand-surface2">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function sokeOrd(sok: string): string[] {
  return sok.toLowerCase().trim().split(/\s+/).filter(Boolean);
}
export function matcher(tekst: string, ord: string[]): boolean {
  if (ord.length === 0) return true;
  const t = tekst.toLowerCase();
  return ord.every((o) => t.includes(o));
}

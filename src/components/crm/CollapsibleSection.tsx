"use client";

// Kopiert fra IMEM-portalen (components/ui/CollapsibleSection.tsx), tilpasset lucide-ikoner og IntelliSense-tokens.
import { useCallback, useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Seksjon som kan lukkes på mobil (under lg). På desktop alltid åpen. Husker tilstand i sessionStorage. */
export function CollapsibleSection({
  id, title, summary, defaultOpenMobile = false, headerExtra, className, children,
}: {
  id: string;
  title: React.ReactNode;
  summary?: React.ReactNode;
  defaultOpenMobile?: boolean;
  headerExtra?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const uid = useId();
  const knappId = `${id}-knapp-${uid}`;
  const innholdId = `${id}-innhold`;
  const lagerNokkel = `seksjon:${pathname}:${id}`;
  const [open, setOpen] = useState(defaultOpenMobile);

  const sett = useCallback(
    (verdi: boolean) => {
      setOpen(verdi);
      try { sessionStorage.setItem(lagerNokkel, verdi ? "1" : "0"); } catch { /* ignorer */ }
    },
    [lagerNokkel]
  );

  useEffect(() => {
    try {
      const lagret = sessionStorage.getItem(lagerNokkel);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lagret !== null) setOpen(lagret === "1");
    } catch { /* ignorer */ }
    const vedHash = () => {
      if (window.location.hash === `#${id}`) sett(true);
    };
    vedHash();
    window.addEventListener("hashchange", vedHash);
    return () => window.removeEventListener("hashchange", vedHash);
  }, [id, lagerNokkel, sett]);

  return (
    <section id={id} className={cn("rounded-2xl border border-brand-border bg-white p-4 sm:p-6 scroll-mt-4", className)}>
      <div className={cn("flex items-center justify-between gap-2", open ? "mb-4" : "mb-0 lg:mb-4")}>
        <h2 className="min-w-0 flex-1 font-semibold text-brand-ink">
          <button
            type="button"
            id={knappId}
            aria-expanded={open}
            aria-controls={innholdId}
            onClick={() => sett(!open)}
            className="lg:hidden -my-2 flex min-h-11 w-full items-center gap-2 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="flex-1">{title}</span>
            <ChevronDown aria-hidden="true" className={cn("h-5 w-5 shrink-0 text-brand-muted motion-safe:transition-transform", open && "rotate-180")} />
          </button>
          <span className="hidden lg:inline">{title}</span>
        </h2>
        {headerExtra}
      </div>
      {!open && summary && <div className="lg:hidden mt-2 text-sm text-brand-muted">{summary}</div>}
      <div id={innholdId} role="region" aria-labelledby={knappId} className={cn(!open && "hidden lg:block")} onInvalidCapture={() => { if (!open) sett(true); }}>
        {children}
      </div>
    </section>
  );
}

"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard/crm", label: "I dag" },
  { href: "/dashboard/crm/pipeline", label: "Pipeline" },
  { href: "/dashboard/crm/firma", label: "Firma" },
  { href: "/dashboard/crm/oppgaver", label: "Oppgaver" },
  { href: "/dashboard/crm/innstillinger", label: "Innstillinger" },
];

export function CrmNav() {
  const p = usePathname();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [p]);
  return (
    <nav ref={ref} aria-label="Salgs-CRM" className="-mx-4 mb-6 flex snap-x snap-mandatory gap-1 overflow-x-auto border-y border-brand-border bg-white p-1 px-4 [scrollbar-width:none] sm:mx-0 sm:rounded-2xl sm:border sm:px-1">
      {tabs.map((t) => {
        const active = t.href === "/dashboard/crm" ? p === t.href : p.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className={cn("crm-focus flex min-h-11 shrink-0 snap-start items-center justify-center whitespace-nowrap rounded-xl px-4 text-sm font-semibold sm:px-5",
              active ? "bg-brand text-white" : "text-brand-ink hover:bg-brand-surface2")}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

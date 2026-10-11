"use client";
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
  return (
    <nav aria-label="Salgs-CRM" className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-brand-border bg-white p-1">
      {tabs.map((t) => {
        const active = t.href === "/dashboard/crm" ? p === t.href : p.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined}
            className={cn("crm-focus flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-sm font-semibold sm:flex-none sm:px-5",
              active ? "bg-brand text-white" : "text-brand-ink hover:bg-brand-surface2")}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

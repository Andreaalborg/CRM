"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/customer", label: "Oversikt", exact: true },
  { href: "/customer/leads", label: "Henvendelser" },
  { href: "/customer/settings", label: "Innstillinger" },
];
export function PortalNav() {
  const p = usePathname();
  return (
    <nav aria-label="Kundeportal" className="mx-auto max-w-5xl px-2">
      <ul className="flex gap-1 overflow-x-auto">
        {items.map((i) => {
          const active = i.exact ? p === i.href : p.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? "page" : undefined}
                className={`crm-focus inline-flex min-h-[44px] items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium ${active ? "border-[var(--color-brand)] text-[var(--color-brand)]" : "border-transparent text-[var(--color-brand-muted)] hover:text-[var(--color-brand-ink)]"}`}>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

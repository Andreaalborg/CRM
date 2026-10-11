"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Skjemaer", href: "/dashboard/forms" },
  { name: "Leads", href: "/dashboard/leads" },
  { name: "E-postmaler", href: "/dashboard/emails" },
  { name: "Automasjoner", href: "/dashboard/automations" },
  { name: "Statistikk", href: "/dashboard/analytics" },
];
const adminLinks = [
  { name: "Salgs-CRM", href: "/dashboard/crm" },
  { name: "Agency Admin", href: "/dashboard/admin" },
  { name: "Fakturaer", href: "/dashboard/invoices" },
];

/** Toppmeny for mobil (sidemenyen skjules under md for å unngå horisontal overflyt). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const all = session?.user?.role === "SUPER_ADMIN" ? [...adminLinks, ...links] : links;
  return (
    <div className="md:hidden border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="font-bold text-slate-900">Kundedata</Link>
        <button type="button" aria-expanded={open} aria-controls="mobilmeny" onClick={() => setOpen(!open)}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100" aria-label={open ? "Lukk meny" : "Åpne meny"}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <nav id="mobilmeny" aria-label="Hovedmeny" className="border-t border-slate-200 px-2 py-2">
          {all.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={cn("block rounded-lg px-3 py-2.5 text-sm font-medium", pathname === l.href ? "bg-indigo-50 text-indigo-800" : "text-slate-700 hover:bg-slate-100")}>
              {l.name}
            </Link>
          ))}
          <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50">Logg ut</button>
        </nav>
      )}
    </div>
  );
}

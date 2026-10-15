import Link from "next/link";
import { requireCustomer } from "@/lib/portal/session";
import { SignOutButton } from "@/components/portal/SignOutButton";
import { PortalNav } from "@/components/portal/PortalNav";

// Fase 4: kundeportal (mobil først). Bare kundebrukere; data avgrenses alltid til egen organisasjon.
export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const c = await requireCustomer();
  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] text-[var(--color-brand-ink)]">
      <a href="#innhold" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Hopp til innhold</a>
      <header className="sticky top-0 z-40 border-b border-[var(--color-brand-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/customer" className="flex min-w-0 items-center gap-3 crm-focus rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/intellisense-symbol.svg" alt="IntelliSense" width={32} height={32} className="h-8 w-8 shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">Kundeportal</span>
              <span className="block truncate font-semibold">{c.orgName}</span>
            </span>
          </Link>
          <SignOutButton />
        </div>
        <PortalNav />
      </header>
      <main id="innhold" className="mx-auto max-w-5xl px-4 py-5 sm:py-8">{children}</main>
      <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-[var(--color-brand-muted)]">Levert av IntelliSense · <a className="underline" href="https://intellisenseai.no/personvern">Personvern</a></footer>
    </div>
  );
}

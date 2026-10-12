import { LoginRequestForm } from "./LoginRequestForm";
export const metadata = { title: "Logg inn – Kundeportal", robots: { index: false } };
export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-brand-bg)] p-4">
      <div className="crm-card w-full max-w-sm p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/intellisense-logo.svg" alt="IntelliSense" width={150} height={32} className="h-8 w-auto" />
        <p className="mt-4 text-sm font-semibold text-[var(--color-brand)]">Kundeportal</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-brand-ink)]">Logg inn</h1>
        <p className="mt-2 text-sm text-[var(--color-brand-muted)]">Skriv e-postadressen din, så sender vi en innloggingslenke. Ingen passord.</p>
        <LoginRequestForm />
        <p className="mt-4 text-sm text-[var(--color-brand-muted)]">Lenken kan bare brukes én gang og utløper etter 15 minutter. Du ser bare dataene til din egen bedrift.</p>
      </div>
    </main>
  );
}

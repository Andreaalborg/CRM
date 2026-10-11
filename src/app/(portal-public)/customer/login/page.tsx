import { LoginRequestForm } from "./LoginRequestForm";
export const metadata = { title: "Logg inn – Kundeportal", robots: { index: false } };
export default function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-brand-bg)] p-4">
      <div className="crm-card w-full max-w-sm p-6">
        <p className="text-sm font-semibold text-[var(--color-brand)]">IntelliSense kundeportal</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-brand-ink)]">Logg inn</h1>
        <p className="mt-2 text-sm text-[var(--color-brand-muted)]">Skriv e-postadressen din, så sender vi en innloggingslenke. Ingen passord.</p>
        <LoginRequestForm />
      </div>
    </main>
  );
}

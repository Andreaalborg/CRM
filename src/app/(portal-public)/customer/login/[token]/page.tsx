import { ConsumeLink } from "./ConsumeLink";
export const metadata = { title: "Logg inn – Kundeportal", robots: { index: false } };
// GET logger ikke inn (e-postskannere skal ikke kunne bruke opp lenken) – brukeren trykker på knappen.
export default async function Token({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-brand-bg)] p-4">
      <div className="crm-card w-full max-w-sm p-6">
        <p className="text-sm font-semibold text-[var(--color-brand)]">IntelliSense kundeportal</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--color-brand-ink)]">Logg inn</h1>
        <ConsumeLink token={token} />
      </div>
    </main>
  );
}

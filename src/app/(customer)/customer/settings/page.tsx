import { requireCustomer } from "@/lib/portal/session";
import { emailHealth } from "@/lib/crm/mailer";
import { SettingsForm } from "@/components/portal/DetailActions";

export const dynamic = "force-dynamic";

export default async function Innstillinger() {
  const c = await requireCustomer();
  const h = await emailHealth();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Innstillinger</h1>
      <section className="crm-card p-4" aria-labelledby="konto">
        <h2 id="konto" className="mb-3 font-semibold">Konto</h2>
        <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-3">
          <dt className="text-[var(--color-brand-muted)]">E-post</dt><dd className="break-all sm:col-span-2">{c.user.email}</dd>
          <dt className="text-[var(--color-brand-muted)]">Bedrift</dt><dd className="sm:col-span-2">{c.orgName}</dd>
        </dl>
        <SettingsForm name={c.user.name ?? ""} notify={c.user.notifyNewSubmissions} blocked={h.ok && !h.dryRun ? null : "venter på e-postoppsett"} />
      </section>
      <p className="text-sm text-[var(--color-brand-muted)]">Innlogging skjer med engangslenke. Vil du legge til flere brukere eller endre logo, kontakt IntelliSense på andreaalborg@intellisenseai.no.</p>
    </div>
  );
}

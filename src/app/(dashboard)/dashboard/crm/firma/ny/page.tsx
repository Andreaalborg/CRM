import Link from "next/link";
import { createCompany } from "@/lib/crm/actions";
import { PageHeader } from "@/components/crm/PageHeader";
import { ActionForm, CompanyFields, Field, Choice, KILDER } from "@/components/crm/Forms";

export default function NyttFirmaPage() {
  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/crm/firma" className="text-sm text-brand hover:underline">← Til firmalisten</Link>
      <PageHeader title="Nytt firma / lead" />
      <ActionForm action={createCompany} submitLabel="Opprett">
        <section className="crm-card p-4 sm:p-6"><h2 className="mb-4 font-semibold">Firma</h2><CompanyFields /></section>
        <section className="crm-card p-4 sm:p-6">
          <h2 className="mb-1 font-semibold">Første deal (valgfritt)</h2>
          <p className="mb-4 text-sm text-brand-muted">Fyll inn tittel for å legge firmaet rett i pipeline som «Kvalifisert».</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="dealTittel" label="Deal-tittel" placeholder="Ny nettside" />
            <Field name="dealVerdi" label="Verdi (NOK eks. mva)" type="number" min={0} />
            <Choice name="dealKilde" label="Kilde" options={KILDER} defaultValue="ANNET" />
            <Field name="nesteSteg" label="Neste steg" />
            <Field name="nesteStegDato" label="Neste steg-dato" type="date" />
          </div>
        </section>
      </ActionForm>
    </div>
  );
}

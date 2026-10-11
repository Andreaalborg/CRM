import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/crm/PageHeader";
import { CompanyList, type CompanyRow } from "@/components/crm/CompanyList";

export const dynamic = "force-dynamic";

export default async function FirmaPage() {
  const companies = await db.company.findMany({
    orderBy: { updatedAt: "desc" },
    include: { deals: { orderBy: { updatedAt: "desc" }, take: 1 }, _count: { select: { contacts: true } } },
  });
  const rows: CompanyRow[] = companies.map((c) => ({
    id: c.id, navn: c.navn, orgnr: c.orgnr, bransje: c.bransje, kommune: c.kommune,
    dealId: c.deals[0]?.id ?? null, stage: c.deals[0]?.stage ?? null, verdi: c.deals[0]?.verdi ?? null,
    nesteStegDato: c.deals[0]?.nesteStegDato?.toISOString() ?? null, kontakter: c._count.contacts,
  }));
  return (
    <div>
      <PageHeader title="Firma" description="Alle firma med siste deal. Velg flere for å sette steg samlet."
        action={<Link href="/dashboard/crm/firma/ny" className="crm-btn"><Plus className="h-4 w-4" aria-hidden="true" /> Nytt firma</Link>} />
      <CompanyList rows={rows} />
    </div>
  );
}

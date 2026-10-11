import { db } from "@/lib/db";
import { PageHeader } from "@/components/crm/PageHeader";
import { PipelineBoard, type BoardDeal } from "@/components/crm/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const deals = await db.deal.findMany({
    orderBy: [{ stage: "asc" }, { position: "asc" }],
    include: { company: { select: { id: true, navn: true, bransje: true } } },
  });
  const data: BoardDeal[] = deals.map((d) => ({
    id: d.id, tittel: d.tittel, stage: d.stage, verdi: d.verdi, sannsynlighet: d.sannsynlighet,
    kilde: d.kilde, nesteSteg: d.nesteSteg, nesteStegDato: d.nesteStegDato?.toISOString() ?? null,
    companyId: d.company.id, companyNavn: d.company.navn, bransje: d.company.bransje,
  }));
  return (
    <div>
      <PageHeader title="Pipeline" description="Dra kortene mellom stegene, eller bruk «Flytt»-menyen / Alt + piltast på et kort." />
      <PipelineBoard deals={data} />
    </div>
  );
}

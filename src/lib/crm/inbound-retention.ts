// Lagringstid for innkommende henvendelser: 12 måneder etter siste aktivitet. Tørrkjøring er standard.
// Rører kun firma som (a) har minst én aktivitet fra nettside/e-post-inngangen, (b) ikke har noen VUNNET deal (kunder følger regnskapsplikt),
// og (c) ikke har noen aktivitet/deal-endring nyere enn grensen.
import { db } from "@/lib/db";

export const INBOUND_RETENTION_MONTHS = 12;

export function retentionCutoff(now: Date, months = INBOUND_RETENTION_MONTHS): Date {
  const d = new Date(now); d.setUTCMonth(d.getUTCMonth() - months); return d;
}

export async function inboundRetention(now = new Date(), apply = false) {
  const cutoff = retentionCutoff(now);
  const cands = await db.company.findMany({
    where: {
      activities: { some: { kilde: { startsWith: "nettside/" } } },
      deals: { none: { stage: "VUNNET" } },
      createdAt: { lt: cutoff },
    },
    select: { id: true, createdAt: true, activities: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 }, deals: { select: { updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 1 } },
  });
  const due = cands.filter((c) => Math.max(c.createdAt.getTime(), c.activities[0]?.createdAt.getTime() ?? 0, c.deals[0]?.updatedAt.getTime() ?? 0) < cutoff.getTime()).map((c) => c.id);
  let deleted = 0;
  if (apply && due.length) deleted = (await db.company.deleteMany({ where: { id: { in: due } } })).count;
  return { dryRun: !apply, cutoff: cutoff.toISOString(), candidates: due.length, deleted, ids: due.slice(0, 50) };
}

// GET /api/v1/inbox-status – skrivebeskyttet status for ubehandlede henvendelser (stage INNKOMMENDE).
// Krever bot-nøkkel med leads:read. Ingen personopplysninger: kun id, kilde-kategori, tidspunkt og alder. Sender ingen e-post.
import { db } from "@/lib/db";
import { authBot, json } from "@/lib/crm/botapi";
import { kildeKategori, workMinutesBetween } from "@/lib/crm/inbox-status";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const bot = await authBot(req, "leads:read");
  if (bot instanceof Response) return bot;
  const now = new Date();
  const deals = await db.deal.findMany({
    where: { stage: "INNKOMMENDE" },
    orderBy: { createdAt: "asc" }, take: 200,
    select: { id: true, createdAt: true, activities: { where: { kilde: { startsWith: "nettside/" } }, orderBy: { createdAt: "asc" }, take: 1, select: { kilde: true } } },
  });
  const items = deals.map((d) => ({
    id: d.id,
    kilde: kildeKategori(d.activities[0]?.kilde),
    opprettet: d.createdAt.toISOString(),
    alder_minutter: Math.max(0, Math.round((now.getTime() - d.createdAt.getTime()) / 60_000)),
    alder_arbeidstimer: Math.round((workMinutesBetween(d.createdAt, now) / 60) * 10) / 10,
  }));
  const eldste = items[0];
  return json({
    naa: now.toISOString(),
    antall_ubehandlede: items.length,
    eldste_alder_minutter: eldste?.alder_minutter ?? 0,
    eldste_alder_arbeidstimer: eldste?.alder_arbeidstimer ?? 0,
    arbeidstid: "man–fre 08:00–17:00 Europe/Oslo (helligdager ikke trukket fra)",
    per_kilde: items.reduce<Record<string, number>>((a, i) => ((a[i.kilde] = (a[i.kilde] || 0) + 1), a), {}),
    henvendelser: items,
  });
}

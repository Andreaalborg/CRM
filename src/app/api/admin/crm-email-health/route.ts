import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { emailHealth } from "@/lib/crm/mailer";

// Helsesjekk for fase 3-sending (kun admin; /api/admin er beskyttet i proxy.ts). Leser bare – sender ingenting.
export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getServerSession(authOptions);
  if (!s || s.user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  const h = await emailHealth();
  return NextResponse.json({ sendingEnabled: h.ok && !h.dryRun ? true : false, ...h }, { status: h.ok ? 200 : 503 });
}
